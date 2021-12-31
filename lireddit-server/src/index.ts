import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

try {
  (async () => {
    const orm = await MikroORM.init(microConfig);
    // await orm.getMigrator().up();
    const app = express();

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, PostResolver],
        validate: false,
      }),
      context: () => ({ em: orm.em }), // 각 resolver가 db에 실제로 접근하기 위한 연결
    });

    await apolloServer.start();
    // graphql 서버 생성
    app.get("/", (_, res) => {
      // 사용하지 않는 매개변수는 _로 표현하는 것이 관례?

      res.send("hello world");
    });
    apolloServer.applyMiddleware({ app }); // express에 graphql endpoint 생성
    app.listen(4000, () => {
      console.log("server started on localhost:4000");
    });
  })();

  // promise 를 return 한다.
} catch (err) {
  console.log(err);
}
