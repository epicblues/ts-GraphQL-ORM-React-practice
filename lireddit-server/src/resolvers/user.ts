import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
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
  // 내가 로그인 한 상태인지 확인하는 query
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse) // 이 query를 통해 return 할 데이터의 type
  async register(
    @Ctx() { em, req }: MyContext,
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
      // 회원 가입이 성공했을 경우 자동 로그인
      // session에 데이터를 넣는 순간
      // express-session은 response에 set-cookies 헤더에 데이터를 입력한다
      req.session.userId = user.id;

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
    req.session.userId = user.id; // session에 어떤 형태의 데이터든 보관 가능하다.(객체 포함)
      // user 데이터 전체를 넣는 경우도 있지만 보통 불변하는 데이터(여기서는 user.id)를 넣는 경우가 많다.

    // express-session이 session 객체에 개발자가 특정한 데이터를 넣었을 경우
    // 해당 사항들을 redis에 저장한다.
    // ex {userId : 1} => send that to redis
    // redis : key-value store
    // key : sessionId(ex: sdifhvhcxhvkdf)
    // value : {userId : 1}

    // express-session이 해당 sessionId를 secret-key로 sign한 value로 삼는 cookie를 만든다.

    // 쿠키를 받은 사용자가 요청을 하면 이제 sign된 sessionId를 서버로 보낸다.

    // 서버에서 해당 cookie에 담긴 id를 secret-key를 이용하여 unsign(decrypt)한다 

    // decrypted된 key를 갖고 express 서버는 redis에 request를 보낸다. -> data 획득

    return {
      user,
    };
  }
}
