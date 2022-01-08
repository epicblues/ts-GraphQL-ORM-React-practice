import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Info,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { FieldError } from "./FieldError";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
  @Field(() => String!)
  title: string;

  @Field(() => String!)
  text: string;
}

@ObjectType()
class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Post, { nullable: true })
  post?: Post;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post) // 어떤 entity를 대상으로 resolve 하는가?
export class PostResolver {
  // 필드 값을 가공해서 전송
  // ex-> Post의 본문이 너무 길 때 미리보기 형태로 제공하기
  // 실제 db에 있는 데이터가 아니다.
  // 서버에서 만들어서 보내는 것
  @FieldResolver(() => String)
  textSnippet(@Root("text") root: string) {
    return root.length > 50 ? root.slice(0, 50).concat("...") : root;
  }

  @Query(() => PaginatedPosts) // 이 query를 통해 return 할 데이터의 type
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Info() info: any // info object에 있는 필드를 활용할 수 있다.
  ): Promise<PaginatedPosts> {
    //pagination 활용 : 한 번에 모든 페이지 데이터를 가져오는 것은 바람직하지 못하다.
    // 2가지 방법 : Cursor Based Pagination vs Offset Based Pagination
    // 후자가 편한 방법이지만, update가 자주 이루어지는 컨텐츠의 경우 순서가 꼬일 수 있다.
    console.log(info);
    const realLimit = Math.min(50, limit) + 1; // 최대 50 record를 db에서 질의하도록
    // 더 받을 수 있는 data가 있는지 trick 부여

    // cf) queryBuilder 없이 진행할 경우. 직접 inner join을 한 다음에 그 데이터들을
    // join된 column들을 갖고 직접 새로운 객체로 만들어야 한다.
    // 아니면  DB에서 지원하는 JSON 생성 함수를 사용해서 특정 필드에 객체를 넣어서 전송할 수 있다.
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p") // alias for post
      .innerJoinAndSelect("p.creator", "u", "u.id = p.creatorId")
      .orderBy("p.createdAt", "DESC")
      .take(realLimit); // 질의 개수 설정

    if (cursor) {
      qb.where("p.createdAt < :cursor", { cursor: new Date(+cursor) });
      // new Date로 완전히 Date 객체로 바꾸어야 비교가 가능하다.
      // cursor보다 일찍 생성된 컨텐츠만 출력한다.

      // 조건에 따라서 순서와 상관 없이 qb에 query를 추가할 수 있다.
    }

    const posts = await qb.getMany();
    const hasMore = posts.length === realLimit;

    return {
      posts: hasMore ? posts.slice(0, realLimit - 1) : posts,
      hasMore,
    };
  }

  @Query(() => Post, { nullable: true }) // 이 query를 통해 return 할 데이터의 type
  post(@Arg("id") id: number): Promise<Post | undefined> {
    // apolloServer 인스턴스를 생성할 때 context 옵션에 넣은 객체를 사용할 수 있다.
    return Post.findOne(id);
  }

  @Mutation(() => PostResponse) // 데이터를 변경(C,U,D)를 할 때 사용하는 decorator
  @UseMiddleware(isAuth) // resolver로 context가 가기 전에 먼저 확인하는 middleware 장착 가능
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    if (input.text.length <= 2) {
      return {
        errors: [{ field: "text", message: "text is too short" }],
      };
    }

    if (input.title.length <= 2) {
      return {
        errors: [{ field: "title", message: "title is too short" }],
      };
    }
    const newPost = await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save(); //entity를 생성하고 save를 통해 db에 질의
    // 사실상 2 SQL : insert / select -> 비효율을 유발할 수 있다.
    // returning을 지원하는 db에서는 한 쿼리로 실행하므로 계속 사용?

    return { post: newPost };
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("id") id: number
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      // entity의 제목을 서버에서 수정하고 수정한 내용을 서버에 질의
      await Post.update({ id }, { title });
    }

    return post;
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("title", () => String, { nullable: true }) title?: string,
    @Arg("id", () => Int, { nullable: true }) id?: number
  ): Promise<boolean> {
    try {
      if (typeof title !== "undefined") {
        await Post.delete({ title });
        return true;
      }
      await Post.delete({ id });
    } catch (err) {
      return false;
    }

    return true;
  }
}
