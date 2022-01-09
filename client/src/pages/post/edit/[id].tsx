import { Box, Button, Flex } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import React from 'react';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import { useMeQuery, useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetPostFromUrl } from '../../../utils/useGetPostFromUrl';




const EditPost = ({ }) => {
  // 먼저 post를 가져온다.
  // url을 읽고 post query를 하는 custom hook
  const [{ data, fetching, error }, , id, router] = useGetPostFromUrl();

  const [{ data: meData }] = useMeQuery();

  const [, updatePost] = useUpdatePostMutation();

  // state checking component
  if (fetching) return (
    <Layout>
      Loading....
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
  // 사용자가 수정 권한이 있는 사용자인가?
  if (!meData || meData.me?.id !== data?.post?.creatorId) {
    return (
      <Layout>
        Not Authorized
      </Layout>
    )
  }

  return (

    <Layout variant='small'>

      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values, { setErrors, }) => {
          await updatePost({ ...values, id });

          // 다른 방식들과 다르게 cache를 제어하는 로직을 만들 필요가 없는 이유
          // update쿼리를 통해 '새로운' post 데이터가 들어오기 때문이다
          // urql은 그 새로운 데이터의 id를 참조해서 캐시에서 해당 데이터를 수정해준다.
          router.back();
          // 이전 페이지로 돌아가는 메서드
        }}>
        {
          ({ isSubmitting }) => (
            <Form>
              <InputField name="title" placeholder="title" label='Title' />
              <Box mt={4}>
                <InputField name="text" placeholder="text..." label='Body' type='textarea' height={100} />
              </Box>
              <Flex justifyContent={"space-between"}>
                <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >update post</Button>

              </Flex>
            </Form>
          )
        }
      </Formik>

    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(EditPost);
