import { Cache, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { NextUrqlClientConfig, SSRExchange } from "next-urql";
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
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  MutationDeletePostArgs,
  PostSnippetFragment,
  PostSnippetFragmentDoc,
  RegisterMutation,
  VoteMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

const invalidateQueryField = (cache: Cache, fieldName: string) => {
  const fieldInfos = cache.inspectFields("Query");
  fieldInfos.forEach((fi) => {
    if (fi.fieldName !== fieldName) return;
    cache.invalidate("Query", fi.fieldName, fi.arguments);
  });
};

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
    const isCacheRemains = cache.resolve(
      entityKey,
      `${fieldName}(${stringifyVariables(fieldArgs)})`
    );
    // cache가 그대로 남아 있으면 partial을 true 바꿀 필요가 없다.
    // 데이터 가져 와!
    // delete하면 특정 쿼리 데이터들만 사라진다.
    info.partial = !isCacheRemains;
    // 쿼리 데이터가 사라지면 urql은 사라진 데이터를 모두 질의하는 것이 아니라
    // 브라우저에서 요청한 것만 다시 질의하ㅡㄴ다.
    let hasMore = true;
    const data: string[] = [];
    fieldInfos.forEach((fi) => {
      //fi.fieldKey = posts({"limit":10})
      // cache에 저장된 query를 순회하는 로직
      // {posts, hasmore} 객체에 접근할 수 있는 key 생성
      const key = cache.resolve(entityKey, fi.fieldKey) as string;

      // 쿼리 결과 안에 객체가 있기 때문에 한 번 더 질의를 해야 한다
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
export const createUrqlClient: NextUrqlClientConfig = (
  ssrExchange: SSRExchange,
  ctx
) => {
  let cookie = "";
  // 이 코드를 읽는 주체가 ssr nextjs일 경우
  // nextjs에서 보낼 api 요청 client에 cookie를 싣는다.
  if (isServer()) {
    cookie = ctx?.req?.headers.cookie as string;
  }
  return {
    url: "http://localhost:4000/graphql",

    fetchOptions: {
      credentials: "include", // cookie 활용
      headers: {
        cookie,
      }, // 웹브라우저에 쿠키가 있을 경우 한 번 확인
    },
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
            deletePost: (
              _result,
              args: MutationDeletePostArgs,
              cache,
              info
            ) => {
              invalidateQueryField(cache, "posts");
            }, // cache에 등록된 특정 데이터 타입을 지우면 기존에 그 데이터를 가져왔던 쿼리를 다시 수행해서 갱신한다.

            vote: (
              _result: VoteMutation,
              args: VoteMutationVariables,
              cache,
              info
            ) => {
              // all posts updated by this
              const { postId, value } = args;
              // voteStatus에 따라서 value를 points에 더하는 값이 달라진다.
              if (!_result.vote.valueOf()) return;
              // 해당 fragment가 캐시 되어있는 지 확인할 수 있는 메서드
              const data = cache.readFragment<Partial<PostSnippetFragment>>(
                PostSnippetFragmentDoc,
                {
                  id: postId,
                }
              ); // 현재 cache된 fragment
              const voteStatus = data?.voteStatus;
              if (voteStatus === null) {
                data!.points! += value;
              } else {
                // vote 한 상태에서 반전되는 것이므로 2배 가중치를 줘야 한다.
                data!.points! += value * 2;
              }
              data!.voteStatus = value;

              cache.writeFragment(PostSnippetFragmentDoc, data);
            },
            createPost: (_result, args, cache, info) => {
              // invalidate query and refetch from server
              // 글을 등록한 시점에서 이 글이 가장 최신인지 알 수 없다.
              // 사용자가 많은 reddit과 같은 서비스가 대표적 예시
              // 해당 항목에 속하는 cache 데이터 제거

              invalidateQueryField(cache, "posts");
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
              invalidateQueryField(cache, "posts");
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
              invalidateQueryField(cache, "posts");
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
              invalidateQueryField(cache, "posts");
            },
          },
        },
      }),
      ssrExchange,
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
  };
};
