import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'
import { NextComponentType } from 'next'
import theme from '../theme'


function MyApp({ Component, pageProps }: { Component: NextComponentType, pageProps: any }) {
  return (

    <ChakraProvider resetCSS theme={theme}>
      <ColorModeProvider
        options={{
          useSystemColorMode: true,
        }}
      >
        <Component {...pageProps} />
      </ColorModeProvider>
    </ChakraProvider>

  )
}

export default MyApp
