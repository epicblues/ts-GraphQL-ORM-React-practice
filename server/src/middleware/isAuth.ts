import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

// runs before your resolver
export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    // 사용자가 로그인 되어 있는지 확인
    // 없을 경우 생성한 에러는 graphql에서 잡아준다.
    throw new Error("not authenticated");
  }
  return next();
};
