import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver {
  @Query(() => String) // 이 query를 통해 return 할 데이터의 type
  hello() {
    return "bye";
  }
}
