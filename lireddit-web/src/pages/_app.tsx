import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'
// graphql 관련 요청/응답을 쉽게 도와주는 라이브러리
import { Provider, createClient } from 'urql'
import theme from '../theme'

// graphql 요청용 클라이언트
const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include", // cookie 활용
  }
})

function MyApp({ Component, pageProps }) {
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
