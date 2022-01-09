import { Updoot } from "../entities/Updoot";
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
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { FieldError } from "./FieldError";

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
    @Ctx() { req: { session } }: MyContext,
    @Info() _: any // info object에 있는 필드를 활용할 수 있다.
  ): Promise<PaginatedPosts> {
    //pagination 활용 : 한 번에 모든 페이지 데이터를 가져오는 것은 바람직하지 못하다.
    // 2가지 방법 : Cursor Based Pagination vs Offset Based Pagination
    // 후자가 편한 방법이지만, update가 자주 이루어지는 컨텐츠의 경우 순서가 꼬일 수 있다.
    const realLimit = Math.min(50, limit) + 1; // 최대 50 record를 db에서 질의하도록
    // 더 받을 수 있는 data가 있는지 trick 부여

    // cf) queryBuilder 없이 진행할 경우. 직접 inner join을 한 다음에 그 데이터들을
    // join된 column들을 갖고 직접 새로운 객체로 만들어야 한다.
    // 아니면  DB에서 지원하는 JSON 생성 함수를 사용해서 특정 필드에 객체를 넣어서 전송할 수 있다.
    console.log(session.userId);
    const posts = await getConnection().query(
      `
      select p.*,
      JSON_OBJECT(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u.createdAt,
        'updatedAt', u.updatedAt
      ) creator,
      ${
        session.userId
          ? `(SELECT value from updoot u where u.userId = ${session.userId} and u.postId = p.id ) voteStatus`
          : `null voteStatus` // sql 기본 값 설정 => null도 하나의 예약어
      }
      from post as p
      inner join user as u 
      on u.id = p.creatorId
      ${cursor ? `where p. createdAt < ?` : ""}
      order by p.createdAt DESC
      limit ?
    `,
      cursor ? [new Date(+cursor), realLimit] : [realLimit]
    );
    for (let post of posts) {
      post.creator = JSON.parse(post.creator);
      console.log(post.voteStatus);
    }
    const hasMore = posts.length === realLimit;

    return {
      posts: hasMore ? posts.slice(0, realLimit - 1) : posts,
      hasMore,
    };
  }

  @Query(() => Post, { nullable: true }) // 이 query를 통해 return 할 데이터의 type
  async post(@Arg("id", () => Int!) id: number): Promise<Post | undefined> {
    // apolloServer 인스턴스를 생성할 때 context 옵션에 넣은 객체를 사용할 수 있다.

    return Post.findOne(id, { relations: ["creator"] });
    // 저절로 inner join을 시켜주는 TypeORM 메서드
    // join된 table의 정보들을 내가 relation decorator로 등록했던 필드에 넣는다.
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int!) postId: number,
    @Arg("value", () => Int!) value: number,
    @Ctx() { req: { session } }: MyContext
  ): Promise<boolean> {
    const isUpdoot = value !== -1;
    // 일종의 선언 : 30포인트 들어와도 1 포인트만 주겠다.
    // 클라이언트의 숫자에서 신경쓰는 것은 +1이냐 -1이냐
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = session;
    // Database에 먼저 중복되는 updoot 레코드가 있는지 확인한다.
    const updoot = await Updoot.findOne({ postId, userId });

    // user has voted on the post before
    if (updoot) {
      if (updoot.value === realValue) {
        // 중복;
        return false;
      }
      // transaction을 통해
      // updoot를 바꾸고
      // 바꾼 값의 2배를 values에 추가한다.
      await getConnection().transaction(async (em) => {
        await em.query(
          `
          update updoot set value = ? 
          where postId = ? and userId = ?
        `,
          [realValue, postId, userId]
        );
        await em.query(
          `
          update post 
          set points = points + ? 
          where id = ?
        `,
          [realValue * 2, postId]
        );
      });
      return true;
    } else {
      // has never voted
      await getConnection().transaction(async (em) => {
        await em.query(
          `
          insert into updoot(userId, postId, value)
          values(?,?,?);
        `,
          [userId, postId, realValue]
        );
        await em.query(`
          update post p 
          SET points = points + ${realValue} 
          where p.id = ${postId};
    `);
      });
      // transaction 단위로 묶어서 하나의 쿼리가 실패하면 둘 다 실패한 것으로 간주한다.

      return true;
    }
  }

  // increase the count on post

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
    @Arg("title", () => String) title: string,
    @Arg("text", () => String) text: string,
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    // const result = await Post.update(
    //   { id, creatorId: req.session.userId },
    //   { title, text }
    // );

    const newResult = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where({ id, creatorId: req.session.userId })
      .execute();

    if (newResult.affected === 1) {
      return await (Post.findOne(
        { id },
        { relations: ["creator"] }
      ) as Promise<Post>);
    }
    return null;
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // without cascading
    // try {
    //   const userId = req.session.userId;
    //   // 묶여 있는 redoop table 제거
    //   await getConnection().transaction(async (em) => {
    //     await em.getRepository(Updoot).delete({ postId: id });
    //     await em.getRepository(Post).delete({ id, creatorId: userId });
    //   });
    //   return true;
    // } catch (err) {
    //   return false;
    // }

    // cascade way
    // 관계를 정의한 필드에 onDelete : CASCADE 설정
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
