
import react from 'react'
import { Form, Formik } from 'formik'
import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Input, Link } from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation, useRegisterMutation, UsernamePasswordInput } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link'

interface LoginProps {

}

const Login: React.FC<LoginProps> = ({ }) => {
  // graphql 요청용 라이브러리
  // key value pair를 받아서 $변수명에 값을 대입한다.
  const [, login] = useLoginMutation();
  const router = useRouter();

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: "", password: "", }}
        onSubmit={async (values, { setErrors, }) => {
          const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors))
          } else if (response.data?.login.user) {
            router.push('/')
          }
        }}>
        {
          ({ isSubmitting }) => (
            <Form>
              <InputField name="usernameOrEmail" placeholder="username or email" label='Username Or Email' />
              <Box mt={4}>
                <InputField name="password" placeholder="password" label='Password' type='password' />
              </Box>
              <Flex justifyContent={"space-between"}>
                <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >login</Button>
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

    </Wrapper>
  );
}


export default withUrqlClient(createUrqlClient)(Login) 