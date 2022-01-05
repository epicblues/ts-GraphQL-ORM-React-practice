import { cacheExchange } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange } from "urql";
import {
  LoginMutation,
  MeQuery,
  MeDocument,
  RegisterMutation,
  LogoutMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

// Next.js Page 전용 urqlClient Wrapper
// ssr 옵션에 따라서 graphql query를 ssr/csr로 구분할 수 있다.
export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include", // cookie 활용
  } as const,
  // const 선언으로 credential type이 string이 아니라 'include'라는 값으로 고정 되었다
  // Cache된 Query를 특정 조건에서 다시 갱신하고자 할 때 사용
  // return 되는 형식이 정확하게 일치해야 한다(같은 property)
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  // 로그인이 잘못되면 기존 cache된 query 유지
                  return query;
                } else {
                  return {
                    // 로그인이 성공할 경우 다시 me request를 하는 것이 아니라(시스템 자원 낭비)
                    // me 의 결과값을 로그인이 성공했을 때 받은 data로 덮어쓰기 한다.
                    me: result.login.user,
                  };
                }
              }
            );
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  // 회원가입이 잘못되면 기존 cache된 query 유지
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.logout.valueOf()) {
                  return {
                    me: null,
                  };
                }
                return query;
              }
            );
          },
        },
      },
    }),
    ssrExchange,
    fetchExchange,
  ],
});
