import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";
import { hashSync, compareSync } from "bcrypt";

@InputType() // 한 arg에 여러 필드를 넣을 수 있다.
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  // 어느 필드에 에러가 있는가
  @Field()
  message: string;
}

@ObjectType() // graphql에서 활용할 수 있게 만드는 decorator
class UserResponse {
  // Error/ 성공시에는 user 데이터
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse) // 이 query를 통해 return 할 데이터의 type
  async register(
    @Ctx() { em }: MyContext,
    @Arg("options") { username, password }: UsernamePasswordInput
  ): Promise<UserResponse> {
    // 사용자들에게 보여줄 error와 개발자가 확인할 error를 구분해아 한다.
    if (username.length <= 2)
      return {
        errors: [
          {
            field: "username",
            message: "length must be greater than 2",
          },
        ],
      };

    if (password.length <= 3)
      return {
        errors: [
          {
            field: "password",
            message: "length must be greater than 3",
          },
        ],
      };
    const hashedPassword = hashSync(password, 10);
    const user = em.create(User, { username, password: hashedPassword });
    try {
      await em.persistAndFlush(user);
      return {
        user,
      };
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return {
          errors: [{ field: "username", message: "Username already exists" }],
        };
      }

      console.log(err); // 개발자가 확인할 error
      return {
        user,
      };
    }
  }

  @Mutation(() => UserResponse) // 이 query를 통해 return 할 데이터의 type
  async login(
    @Ctx() { em, req }: MyContext,
    @Arg("options") { username, password }: UsernamePasswordInput
  ): Promise<UserResponse> {
    // 핵심 : UserResponse 객체를 꼭 new나 constructor를 통해 만들 필요가 없다!!!!!!
    const user = await em.findOne(User, { username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "that username doesn't exist",
          },
        ],
      };
    }
    if (!compareSync(password, user!.password))
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    (req.session as any).userId = user.id; // session에 어떤 형태의 데이터든 보관 가능하다.

    return {
      user,
    };
  }
}
