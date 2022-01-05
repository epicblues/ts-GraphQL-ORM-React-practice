import { Box, Button, Flex } from '@chakra-ui/react';
import { Link } from '@chakra-ui/react';
import react, { ReactElement, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useMeQuery } from '../generated/graphql';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {

  let body = null;
  const [{ fetching, data, }] = useMeQuery.call(this);
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
        <Button variant={"link"}>Logout</Button>
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