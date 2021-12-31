import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from "path";

// migrations을 통해 직접 table을 만들게 해주는 설정?
// MikroORM cli를 통해 테이블 간접 제어?ㅇ
const config: Parameters<typeof MikroORM.init>[0] = {
  // 반드시 typeof를 붙여야 한다.
  dbName: "lireddit",
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  debug: !__prod__,
  migrations: {
    path: path.join(__dirname, "./migrations"), // 절대 경로로 만들기
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  type: "mysql",
  entities: [Post], // 해당 db에들어있는 table
};

export default config;
