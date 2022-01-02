import { MyContext } from "src/types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver {
  @Query(() => String) // 이 query를 통해 return 할 데이터의 type
  hello(@Ctx() ctx: MyContext) {
    const name = ctx.req.session.userId;
    return `hello ${name}`;
  }
}
