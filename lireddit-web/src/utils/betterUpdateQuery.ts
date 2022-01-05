import { QueryInput, Cache } from "@urql/exchange-graphcache";

// updateQuery의 타입 확인을 용이하게 하는 wrapper function
// generic을 통해 updateQuery의 타입을 구체적으로 바꾼다
// generic을 활용하게 위해 일반 함수 표현식을 사용한다
export function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
