import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'
import { Cache, cacheExchange, QueryInput, } from '@urql/exchange-graphcache'
import { NextComponentType, NextPageContext } from 'next'
// graphql 관련 요청/응답을 쉽게 도와주는 라이브러리
import { Provider, createClient, dedupExchange, fetchExchange, } from 'urql'
import { LoginMutation, MeDocument, MeQuery, RegisterMutation, } from '../generated/graphql'
import theme from '../theme'


// updateQuery의 타입 확인을 용이하게 하는 wrapper function
// generic을 통해 updateQuery의 타입을 구체적으로 바꾼다
// generic을 활용하게 위해 일반 함수 표현식을 사용한다
function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, data => fn(result, data as any) as any)
}

// graphql 요청용 클라이언트
const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include", // cookie 활용
  },
  // Cache된 Query를 특정 조건에서 다시 갱신하고자 할 때 사용
  // return 되는 형식이 정확하게 일치해야 한다(같은 property)
  exchanges: [dedupExchange, cacheExchange({
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
                return query
              } else {
                return {
                  // 로그인이 성공할 경우 다시 me request를 하는 것이 아니라(시스템 자원 낭비)
                  // me 의 결과값을 로그인이 성공했을 때 받은 data로 덮어쓰기 한다.
                  me: result.login.user
                }
              }

            }
          )
        }
        ,
        register: (_result, args, cache, info) => {
          betterUpdateQuery<RegisterMutation, MeQuery>(
            cache,
            { query: MeDocument },
            _result,
            (result, query) => {
              if (result.register.errors) {
                // 회원가입이 잘못되면 기존 cache된 query 유지
                return query
              } else {
                return {
                  me: result.register.user
                }
              }

            }
          )
        }
      }
    }
  }), fetchExchange]
})

function MyApp({ Component, pageProps }: { Component: NextComponentType, pageProps: any }) {
  return (
    <Provider value={client}>

      <ChakraProvider resetCSS theme={theme}>
        <ColorModeProvider
          options={{
            useSystemColorMode: true,
          }}
        >
          <Component {...pageProps} />
        </ColorModeProvider>
      </ChakraProvider>
    </Provider>

  )
}

export default MyApp
