import { Request, Response } from "express";
import session, { SessionData } from "express-session";
import { Redis } from "ioredis";
import { createUpdootLoader, createUserLoader } from "./utils/createUserLoader";

export type MyContext = {
  req: Request & {
    session: session.Session & Partial<SessionData> & { userId?: number }; // 원하는 필드값을 넣고 싶을 때
  };
  res: Response;
  redis: Redis;
  //TypeScript ReturnType<typeof 함수명>
  // 함수가 반환하는 type을 사용할 수 있다.
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
