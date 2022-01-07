import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { toErrorMap } from '../utils/toErrorMap';
import { useIsAuth } from '../utils/useIsAuth';



const CreatePost: React.FC = ({ }) => {
  // 권한이 없으면 먼저 튕겨내기?
  const [, , router] = useIsAuth();

  const [, createPost] = useCreatePostMutation();
  return (
    <Layout variant='small'>

      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values, { setErrors, }) => {
          const response = await createPost({ input: values });

          if (response.data?.createPost.errors) {
            setErrors(toErrorMap(response.data.createPost.errors));
            return;
          }
          router.push('/')
        }}>
        {
          ({ isSubmitting }) => (
            <Form>
              <InputField name="title" placeholder="title" label='Title' />
              <Box mt={4}>
                <InputField name="text" placeholder="text..." label='Body' type='textarea' height={100} />
              </Box>
              <Flex justifyContent={"space-between"}>
                <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >create post</Button>
                <NextLink href="/forgot-password">
                  <Box mt={4}>
                    <Link>Forgot password? </Link>
                  </Box>
                </NextLink>
              </Flex>
            </Form>
          )
        }
      </Formik>

    </Layout>
  );
}


export default withUrqlClient(createUrqlClient)(CreatePost);
