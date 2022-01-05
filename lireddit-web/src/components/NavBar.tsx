import { Box, Button, Flex } from '@chakra-ui/react';
import { Link } from '@chakra-ui/react';
import react, { ReactElement, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {

  let body = null;
  const [{ fetching, data, }] = useMeQuery.call(this);
  // fetching 을 통해 마치 promise pending state를 조회하듯이 상태를 확인하고
  // fetching이 false가 되면 그에 따라 바뀌어있는 data를 확인해서
  // 요청했던 결과를 확인하는 방식

  const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
  // urql이 사이트의 상태를 저장하기 때문에
  // 이전에 갔던 페이지들을 react routing으르 통해 다시 방문해도
  // fetching을 하지 않고 cached된 기존 상태값을 유지한다.




  // 3개 이상의 상태에 따라 컴포넌트 모양이 바뀌어야 할 때
  // data is loading
  if (fetching) {

  } else if (!data?.me) {
    body = (<><NextLink href="/login">

      <Link mr={4} > Login
      </Link>
    </NextLink>
      <NextLink href="/register" >
        <Link > Register
        </Link>

      </NextLink>
    </>)
    // user is logged in
  } else {
    body = (
      <Flex>
        <Box mr={4}>
          Welcome, {data.me.username}
        </Box>
        <Button variant={"link"} onClick={() => { logout() }} isLoading={logoutFetching}>Logout</Button>
      </Flex>
    )
  }



  return (
    <Flex p={4} bg="tan">
      <Box ml={"auto"}>
        {body}
      </Box>
    </Flex>
  );
}