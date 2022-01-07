import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { hashSync, compareSync } from "bcrypt";
// MikroOrm의 em이 정상적으로 사용되지 못할 경우
// 직접 querybuilder를 사용해서 query를 만들어야 한다.(knex 사용)
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
// version 4 UUID를 생성하는 메서드
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { FieldError } from "./FieldError";

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
  @Mutation(() => UserResponse)
  async changePassword(
    @Ctx() { redis }: MyContext,
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string
  ): Promise<UserResponse> {
    if (newPassword.length <= 3)
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 3",
          },
        ],
      };
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId)
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    try {
      const user = await User.findOne({ id: +userId });
      if (!user)
        return {
          errors: [
            {
              field: "token",
              message: "user no longer exists",
            },
          ],
        };

      // db에서 user를 받아오고 서버에서 수정한 다음에
      // 그 수정한 entity를 db에 반영하는 방식? (즉 db에서 update query를 수행하는 것이 아니다)
      await User.update(
        { id: user.id },
        { password: hashSync(newPassword, 10) }
      );
      // 더 이상 token이 유효하지 않게 db에서 삭제
      await redis.del(key);
      return {
        user,
      };
    } catch (error) {
      console.log(error);
      return {
        errors: [
          {
            field: "newPassword",
            message: "update failed",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: MyContext,
    @Arg("email") email: string
  ): Promise<boolean> {
    // 먼저 해당 이메일을 가진 사용자가 있는지 확인한다.
    const user = await User.findOne({ email });
    if (!user) {
      // 이메일이 db에 없다.
      return true; // 이메일이 db에 없다는 사실을 알리고 싶지 않을 때(보안)
    }

    // 사용자가 맞을 경우 그 사용자에게 이메일을 보낸다.
    // 그 사용자가 맞다는 token을 생성하고 redis에 저장한다.
    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3 // 3일 동안 유지 되는 비밀번호 변경 토큰
    );

    // 해당 token이 담긴 link를 이메일로 보낸다.
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return !!user;
  }

  // 내가 로그인 한 상태인지 확인하는 query
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    if (!req.session.userId) {
      return undefined;
    }

    return await User.findOne({ id: req.session.userId });
  }

  @Mutation(() => UserResponse) // 이 query를 통해 return 할 데이터의 type
  async register(
    @Ctx() { req }: MyContext,
    @Arg("options")
    options: UsernamePasswordInput
  ): Promise<UserResponse> {
    // 사용자들에게 보여줄 error와 개발자가 확인할 error를 구분해아 한다.
    const errors = validateRegister(options);
    // refactoring 이유 : 내가 UserResponse 형태를 바꾸어도 validateRegister 코드를 수정할 필요는 없다.
    // 수정은 여기에서 끝낸다.
    if (errors) return { errors };

    const hashedPassword = hashSync(options.password, 10);
    const results = await getConnection() // 전역적으로 설정된 connection을 가져온다.
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        username: options.username,
        password: hashedPassword,
        email: options.email,
      })
      .execute(); // cf) 다른 db에서는 returning 메서드를 통해 삽입된 레코드 결과를 가져올 수 있다.
    const user = await User.findOne(results.generatedMaps[0].id as number);

    console.log(results);
    try {
      req.session.userId = user!.id;

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
    @Ctx() { req }: MyContext,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string
  ): Promise<UserResponse> {
    // 핵심 : UserResponse 객체를 꼭 new나 constructor를 통해 만들 필요가 없다!!!!!!

    const isEmail = usernameOrEmail.includes("@");

    const user = await User.findOne(
      isEmail // @가 있으면 이메일, 없으면 username이라 간주
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: `that ${isEmail ? "email" : "username"} doesn't exist`,
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

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    // redis에 저장된 세션 정보 제거
    // redis 서버에 삭제 요청을 하기 때문에 callback 형태로 구성된 것 같다.

    return await new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        res.clearCookie(COOKIE_NAME);
        // 해당 key에 해당하는 쿠키 value 제거
        resolve(true);
      })
    );
    // 기존에 했던 것보다 훨씬 더 간단한 형태의 Promisify
  }
}
