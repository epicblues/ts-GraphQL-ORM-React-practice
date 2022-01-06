import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
// redis 데이터베이스를 session 저장소로 활용하기 위한 라이브러리들
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import Redis from "ioredis";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";

try {
  (async () => {
    await createConnection({
      type: "mysql",
      database: "lireddit2",
      username: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      logging: true,
      synchronize: true, // migration 없이 애플리케이션의 entity를 db와 동기화
      entities: [Post, User],
    });
    const app = express();

    // cors -> 클라이언트에서 credentials(cookie 등)을 활용하려면
    // Access-Allow-Control-Origin이 "*" 면 안 된다.
    // 또한 Access-Allow-Control-Credential이 true여야 한다.
    app.use(cors({ origin: "http://localhost:3000", credentials: true }));

    // redis 라이브러리 ^3만 지원
    // Redis를 활용한 session 저장소
    const RedisStore = connectRedis(session);
    const redis = new Redis();

    // 미들 웨어 배치 순서 중요성
    // 먼저 session 미들웨어를 사용했기 때문에 apolloServer를 사용하기 전에 인증을 먼저 한다.
    app.use(
      session({
        name: COOKIE_NAME, // 브라우저에 저장될 쿠키 key 이름
        store: new RedisStore({
          client: redis,
          disableTouch: true, // 해당 session을 가진 사용자가 활동을 할 때마다 TTL을 갱신할 것인가.
          disableTTL: true, // session 유효 기간 설정(disable로 할 경우 session이 영원히 유지된다.)
        }), // session 저장을 redis에 설정한다.
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: "lax", // protecting csrf
          secure: __prod__, // cookie only works in https
        },
        saveUninitialized: true, // create session by default(even if i didn't store data in it) => by setting false i could save session only when i saved data
        secret: process.env.SESSION_SECRET!,
        resave: false,
      })
    );

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, PostResolver, UserResolver],
        validate: false,
      }),
      context: ({ req, res }): MyContext => ({ req, res, redis }), // 각 resolver가 db에 실제로 접근하기 위한 연결
      // session에 접근할 수 있게 req,res를 인자로 받는 callback 함수를 설정할 수 있다.
      plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });

    await apolloServer.start();
    // graphql 서버 생성
    app.get("/", (_, res) => {
      // 사용하지 않는 매개변수는 _로 표현하는 것이 관례?

      res.send("hello world");
    });
    apolloServer.applyMiddleware({
      app,
      cors: false,
    }); // express에 graphql endpoint 생성
    app.listen(4000, () => {
      console.log("server started on localhost:4000");
    });
  })();

  // promise 를 return 한다.
} catch (err) {
  console.log(err);
}
