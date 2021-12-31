import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // 이 query를 통해 return 할 데이터의 type
  posts(@Ctx() { em }: MyContext) {
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
}
