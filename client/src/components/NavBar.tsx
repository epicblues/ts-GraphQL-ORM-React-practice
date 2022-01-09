import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {

  let body = null;
  const [{ fetching, data, }] = useMeQuery()
  // fetching 을 통해 마치 promise pending state를 조회하듯이 상태를 확인하고
  // fetching이 false가 되면 그에 따라 바뀌어있는 data를 확인해서
  // 요청했던 결과를 확인하는 방식

  // component를 사용하는 page가 ssr일 경우
  // 이 컴포넌트를 읽는 주체는 Server가 된다.
  // 하지만 서버에는 cookie가 존재하지 않으므로  meQuery를 원활하게 실행할 수 없다.
  // 따라서 server가 해당 query를 실행하지 않도록 pause 프로퍼티를  true로 할 수 있다.

  const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
  // urql이 사이트의 상태를 저장하기 때문에
  // 이전에 갔던 페이지들을 react routing으르 통해 다시 방문해도
  // fetching을 하지 않고 cached된 기존 상태값을 유지한다.

  const router = useRouter()



  // 3개 이상의 상태에 따라 컴포넌트 모양이 바뀌어야 할 때
  // data is loading
  if (fetching) {

  } else if (!data?.me) {
    body = (
      <>
        <NextLink href={"/login?next=" + router.asPath}>
          <Link mr={4} > Login </Link>
        </NextLink>

        <NextLink href="/register" >
          <Link > Register
          </Link>
        </NextLink>
      </>)
    // user is logged in
  } else {
    body = (
      <>
        <NextLink href="/create-post">
          <Button as={Link} mr={4} colorScheme={"orange"}>Create Post</Button>
          {/* look like button but act as link */}
        </NextLink>
        <Box mr={4}>
          {data.me.username}
        </Box>
        <Button variant="link" onClick={() => { logout() }} isLoading={logoutFetching}>Logout</Button>
      </>
    )
  }



  return (
    <Flex p={4} bg="tan" position="sticky" top={0} zIndex={1} >
      <Flex alignItems={"center"} maxWidth={800} flex={1} m={"auto"}>
        {/* 상위 flex에서 이 아이템이 얼마나 공간을 차지하는가? */}
        {/* MaxWidth가 있기 때문에 항상 전체를 차지하지는 않는다. */}
        <NextLink href="/">
          <Link>
            <Heading>
              Lireddit
            </Heading>
          </Link>
        </NextLink>

        <Flex ml={"auto"} alignItems={"center"} >
          {body}
        </Flex>

      </Flex>
      {/* sticky => 스크롤 상관 없이 해당 위치 유지, fixed 유사? */}
    </Flex>
  );
}