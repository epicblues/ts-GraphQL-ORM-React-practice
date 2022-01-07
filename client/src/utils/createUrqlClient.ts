import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import Router from "next/router";
import {
  CombinedError,
  dedupExchange,
  errorExchange,
  fetchExchange,
  Operation,
  stringifyVariables,
} from "urql";
import {
  CreatePostMutation,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  PostsDocument,
  PostsQuery,
  RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const cursorPagination = (): Resolver => {
  // resolver 함수를 return 하는 함수
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // 'Query', 'posts'
    const allFields = cache.inspectFields(entityKey);
    // 프로젝트가 커지면 다양한 query가 들어온다.
    console.log(allFields);
    // inspect all the queries in your cache
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    console.log(fieldArgs); // 실행되서 이 함수를 호출한 필드의 인자 {limit : 10}
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    console.log(fieldKey);

    const isItInTheCache = cache.resolve(entityKey, fieldKey) as string[];
    console.log(isItInTheCache);
    // 캐시 되어 있지 않으면 해당 키에 맞게 다시 graphql request를 보낸다.
    info.partial = true;

    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      //fi.fieldKey = posts({"limit":10})
      const data = cache.resolve(entityKey, fi.fieldKey) as string[];
      // 핵심 로직 : pagination이 이루어질 수록
      // 해당 results 배열의 크기가 커진다.
      results.push(...data);
    });
    return results; // Entity 이름과 고유 id로 이루어진 배열만 주면 그것을 파싱해서 데이터를 보여준다?
  };
};

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
      resolvers: {
        // client side resolver : client - side에서 작동하는 query 제어
        Query: {
          posts: cursorPagination(), // posts.graphql의 query와 이름이 일치해야 한다.
        },
      },
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
    ssrExchange, // nextjs 전용
    errorExchange({
      // graphql로 발생한 Error handling
      onError: (error: CombinedError, operation: Operation) => {
        if (error.message.includes("not authenticated")) {
          // hooks가 아닌 전역 next router
          Router.replace("/login");
        }
      },
    }),
    fetchExchange,
  ],
});
