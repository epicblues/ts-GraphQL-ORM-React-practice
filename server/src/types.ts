import { Request, Response } from "express";
import session, { SessionData } from "express-session";
import { Redis } from "ioredis";

export type MyContext = {
  req: Request & {
    session: session.Session & Partial<SessionData> & { userId?: number }; // 원하는 필드값을 넣고 싶을 때
  };
  res: Response;
  redis: Redis;
};
