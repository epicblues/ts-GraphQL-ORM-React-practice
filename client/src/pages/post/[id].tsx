import { Box, Flex, Heading, IconButton } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import Router, { useRouter } from 'next/router'
import React from 'react'
import { Layout } from '../../components/Layout'
import { useDeletePostMutation, useMeQuery, usePostQuery } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl'
import NextLink from 'next/link'
import { Link } from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons'


const Post = ({ }) => {
  const [{ data, fetching, error }, , , router] = useGetPostFromUrl()
  // pause가 true일 경우 해당 query를 실행하지 않는다.

  const [, deletePost] = useDeletePostMutation()
  // state checking component
  if (fetching) return (
    <Layout>
      Fetching
    </Layout>
  )

  if (error) {
    return (
      <Layout>
        {error.message}
      </Layout>);
  }

  if (!data?.post) return (

    <Layout>
      Could not find the post
    </Layout>
  )
  const p = data.post;

  return (

    <Layout>
      <Heading >
        <Flex>

          {data.post.title}

          <EditDeletePostButtons postId={p.id} onDelete={async () => {
            await deletePost({ id: p.id });
            router.push('/');
          }} ml="auto" creatorId={p.creatorId} />
        </Flex>
      </Heading>
      <Box mt={5}>
        {data.post.text}

      </Box>
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);

