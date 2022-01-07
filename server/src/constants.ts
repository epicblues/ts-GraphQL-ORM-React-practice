export const __prod__ = process.env.NODE_ENV === "production";
// dev mode냐 build 모드냐 구분.
export const COOKIE_NAME = "qid";
// redis 에 key값으로 활용할 forget-password
export const FORGET_PASSWORD_PREFIX = "forget-password:";
