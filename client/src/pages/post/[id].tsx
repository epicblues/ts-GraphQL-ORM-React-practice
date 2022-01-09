import { Box, Heading } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { Layout } from '../../components/Layout'
import { usePostQuery } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'



const Post = ({ }) => {
  const router = useRouter();
  const intId = typeof router.query.id === "string" ? +router.query.id : -1
  console.log(intId);
  const [{ data, fetching, error }] = usePostQuery({
    pause: intId === -1,
    variables: { id: intId }
  })
  // pause가 true일 경우 해당 query를 실행하지 않는다.

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


  return (

    <Layout>
      <Heading>
        {data.post.title}

      </Heading>
      <Box mt={5}>
        {data.post.text}

      </Box>
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);

