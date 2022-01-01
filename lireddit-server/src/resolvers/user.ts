import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from "type-graphql";
import { hashSync } from "bcrypt";

@InputType() // 한 arg에 여러 필드를 넣을 수 있다.
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User, { nullable: true }) // 이 query를 통해 return 할 데이터의 type
  async register(
    @Ctx() { em }: MyContext,
    @Arg("options") { username, password }: UsernamePasswordInput
  ): Promise<User | null> {
    const hashedPassword = hashSync(password, 10);
    const user = em.create(User, { username, password: hashedPassword });
    try {
      await em.persistAndFlush(user);
      return user;
    } catch (err) {
      return null;
    }
  }
}
