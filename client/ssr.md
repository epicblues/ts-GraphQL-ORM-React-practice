# SSR 개념 순서

1.  me -> browse http://localhost:3000
2.  -> next.js server
3.  -> request graphql http://server localhost:4000
4.  -> building the HTML
5.  -> sending back to your browser

# SSR With Cookies

## CSR

- browser -> graphql api(with cookies)

## SSR

- browser -> next.js -> graphql api(without cookies)
- 해결책 : next.js 서버에 cookie를 보낼 수 있도록 한다.
