import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // 이 query를 통해 return 할 데이터의 type
  async posts(@Ctx() { em }: MyContext) {
    // apolloServer 인스턴스를 생성할 때 context 옵션에 넣은 객체를 사용할 수 있다.
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true }) // 이 query를 통해 return 할 데이터의 type
  post(@Arg("id") id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    // apolloServer 인스턴스를 생성할 때 context 옵션에 넣은 객체를 사용할 수 있다.
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post) // 데이터를 변경(C,U,D)를 할 때 사용하는 decorator
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const newPost = em.create(Post, { title });
    await em.persistAndFlush(newPost);
    return newPost;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post); // update도 똑같이 persisAndFlush를 사용한다.
      // 내가 처음에 했던 nativeUpdate랑 차이점
    }

    return post;
  }
  @Mutation(() => Boolean)
  async deletePost(
    @Ctx() { em }: MyContext,
    @Arg("title", () => String, { nullable: true }) title?: string,
    @Arg("id", () => Int, { nullable: true }) id?: number
  ): Promise<boolean> {
    try {
      if (typeof title !== "undefined") {
        await em.nativeDelete(Post, { title });
        return true;
      }
      await em.nativeDelete(Post, { id });
    } catch (err) {
      return false;
    }

    return true;
  }
}
