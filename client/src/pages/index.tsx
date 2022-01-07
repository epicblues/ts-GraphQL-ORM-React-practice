import { Box, Button, Flex, Heading, Link, Text } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import { Layout } from '../components/Layout';
import { NavBar } from '../components/NavBar';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link'
import { Stack } from '@chakra-ui/react'
import { useState } from 'react';

const Index = () => {
  const [variables, setVariables] = useState<{ limit: number, cursor?: string }>({ limit: 10 });
  const [{ data, fetching, }] = usePostsQuery({ variables });
  // query에 variable이 필요한 경우

  // SSR을 true로 해 놓을 경우 fetching이 false로 될 때 까지 페이지 응답을 보내지 않는다.

  // runtime 이 함수로 들어왔을 때 이 부분을 먼저 확인한다.
  if (!fetching && (!data)) {

    return <div>You got query failed for some reason</div>
  }

  return (
    <Layout variant='regular'>
      <Flex align={"center"}>
        <Heading>LiReddit</Heading>
        <NextLink href="/create-post">
          <Link ml={"auto"}>Create Post</Link>
        </NextLink>
      </Flex>
      <Stack spacing={8} mt={4}>
        {data ? data.posts.posts.map(p => (

          <Box key={p.id} p={5} shadow={"md"} borderWidth={"1px"} >
            <Heading fontSize={"xl"}>{p.title}</Heading>
            <Text mt={4}>{p.textSnippet}</Text>
          </Box>
        )) : <div>Loading</div>}

      </Stack>
      {(data && data.posts.hasMore) &&
        <Flex >
          <Button margin="auto" bgColor={"teal"} my={8} onClick={() => {
            setVariables({ limit: 10, cursor: data.posts.posts[data.posts.posts.length - 1].createdAt });

          }} isLoading={fetching}>Load More
          </Button>
        </Flex>
      }
    </Layout>);

}
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
// server side에서 graphql 쿼리를 실행하고 데이터를 미리 가져오도록 하게 하는 wrapper
// 두 번째 parameter로 ssr을 true로 해 놓으면 서버에서 응답을 받을 때 까지 페이지를 렌더링 하지 않는다.