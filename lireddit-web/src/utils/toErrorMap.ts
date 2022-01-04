import { FieldError } from "../generated/graphql";

// 배열을 일반 객체로 전환하는 함수
export const toErrorMap = (errors: FieldError[]) => {
  const errorMap: Record<string, string> = {};
  // key, value 모두 string이어야 하는 객체?
  errors.forEach(({ field, message }) => {
    errorMap[field] = message;
  });

  return errorMap;
};
