import { NextRouter, useRouter } from "next/router";
import { useEffect } from "react";
import { MeQuery, useMeQuery } from "../generated/graphql";

// 사용자 개인화 페이지에 접근하기 전에
// 사용자가 로그인되어 있는지 확인하고
// 로그인 되어 있지 않을 경우 login page로 보내는 custom hook
export const useIsAuth = (): [MeQuery | undefined, boolean, NextRouter] => {
  const [{ data, fetching }] = useMeQuery();
  const router = useRouter();
  useEffect(() => {
    if (!fetching && !data?.me)
      // fetching이 false가 되어야 meQuery의 결과값을 확인할 수 있다.
      router.replace("/login?next=" + router.pathname); // 이동 하기 전에 지금 경로를 저장한다
    // login 페이지에서 router.query.next 로 접근할 수 있다.
  }, [data, router, fetching]);

  return [data, fetching, router];
};
