import dotenv from "dotenv";
dotenv.config();
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

try {
  (async () => {
    const orm = await MikroORM.init(microConfig);
    // await orm.getMigrator().up();
    // 다른 db 작업을 시작하기 전에 migration을 먼저 수행한다.
    // orm 설정에 migration 프로퍼티가 유효해야 한다.
    const post = orm.em.create(Post, { title: "my third post" });
    await orm.em.persistAndFlush(post);

    const posts = await orm.em.find(Post, {});
    // mongodb처럼 모든 Post 레코드 찾기
    console.log(posts);
  })();

  // promise 를 return 한다.
} catch (err) {
  console.log(err);
}
