import dotenv from "dotenv";
dotenv.config();
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

try {
  (async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();
    // 다른 db 작업을 시작하기 전에 migration을 먼저 수행한다.
    const post = orm.em.create(Post, {
      title: "my first post",
    });
    // nativeinsert 메서드보다 좋은 이유: 각종 default 값을 알아서 decorator를 통해 입력해준다.

    // Post 인스턴스를 생성한다. 아직까지는 DB와 관련이 없다.
    // 사실상 new Post("my first post")와 본질적인 기능은 다르지 않다. decorator를 통한 기본값 입력 제외
    await orm.em.persistAndFlush(post);
    // db에 전송
  })();

  // promise 를 return 한다.
} catch (err) {
  console.log(err);
}
