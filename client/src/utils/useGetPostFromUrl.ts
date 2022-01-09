import { NextRouter, useRouter } from "next/router";
import { UseQueryResponse } from "urql";
import { PostQuery, usePostQuery } from "../generated/graphql";

// 튜플로 이루어진 타입도 배열처럼 구조 분해 할당이 가능하다.
export const useGetPostFromUrl = (): [
  ...UseQueryResponse<PostQuery, object>,
  number,
  NextRouter
] => {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? +router.query.id : -1;
  return [
    ...usePostQuery({
      pause: id === -1, // 이 조건이 만족되면 query를 실행하지 않는다.
      variables: {
        id,
      },
    }),
    id,
    router,
  ];
};
