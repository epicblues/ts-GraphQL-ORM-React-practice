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
  PaginatedPosts,
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
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    console.log(fieldArgs); // 실행되서 이 함수를 호출한 필드의 인자 {limit : 10}

    info.partial = true;

    let hasMore = true;
    const data: string[] = [];
    fieldInfos.forEach((fi) => {
      //fi.fieldKey = posts({"limit":10})
      // cache에 저장된 query를 순회하는 로직
      console.log(fi.fieldKey);
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      // 쿼리 결과 안에 객체가 있기 때문에 한 번 더 질의를 해야 한다.
      data.push(...(cache.resolve(key, "posts") as string[]));
      const _hasMore = cache.resolve(key, "hasMore") as boolean;

      if (!_hasMore) hasMore = _hasMore;
      // 하나라도 hasMore가 false면 더 이상 가질 게 없다는 뜻
    });
    return {
      __typename: "PaginatedPosts", // typename을 반드시 적어줘야 nested 객체를 urql이 이해할 수 있다.
      hasMore,
      posts: data,
    }; // Entity 이름과 고유 id로 이루어진 배열만 주면 그것을 파싱해서 데이터를 보여준다?
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
      keys: {
        PaginatedPosts: () => null, // nested 응답 객체의 key가 없을 경우
      },
      resolvers: {
        // client side resolver : client - side에서 작동하는 query 제어
        Query: {
          posts: cursorPagination(), // posts.graphql의 query와 이름이 일치해야 한다.
        },
      },
      updates: {
        Mutation: {
          createPost: (_result, args, cache, info) => {
            // invalidate query and refetch from server
            // 글을 등록한 시점에서 이 글이 가장 최신인지 알 수 없다.
            // 사용자가 많은 reddit과 같은 서비스가 대표적 예시
            // 해당 항목에 속하는 cache 데이터 제거

            const allFields = cache.inspectFields("Query");
            const fieldInfos = allFields.filter(
              (info) => info.fieldName === "posts"
            );
            // 연관된 모든  query를 invalidate 한다.
            fieldInfos.forEach((info) => {
              cache.invalidate("Query", info.fieldName, info.arguments);
              // 모든 cache 제거(Query -> post)
              // 첫 페이지로 이동하면서 첫 쿼리만 다시 수행
            });
          },
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
