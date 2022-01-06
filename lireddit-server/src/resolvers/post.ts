import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
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

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // 이 query를 통해 return 할 데이터의 type
  async posts() {
    // apolloServer 인스턴스를 생성할 때 context 옵션에 넣은 객체를 사용할 수 있다.
    return await Post.find();
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
