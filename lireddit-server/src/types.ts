import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import session, { SessionData } from "express-session";

export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & {
    session: session.Session & Partial<SessionData> & { userId?: number }; // 원하는 필드값을 넣고 싶을 때
  };
  res: Response;
};
