
import react from 'react'
import { Form, Formik } from 'formik'
import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation, useRegisterMutation, UsernamePasswordInput } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

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
        initialValues={{ username: "", password: "", }}
        onSubmit={async (values, { setErrors, }) => {
          console.log(values);
          const response = await login({ options: values });
          if (response.data?.login.errors) {
            // Optional Chaining 습관화 => 프로그램이 throw error 하는 것 방지

            setErrors(toErrorMap(response.data.login.errors))
            // 특정 input에 자동으로 mapping 되게 하는 formik 모듈 전용 에러 처리 함수)
          } else if (response.data?.login.user) {
            router.push('/')
          }
        }}>
        {
          ({ isSubmitting }) => (
            <Form>
              <InputField name="username" placeholder="username" label='Username' />
              <Box mt={4}>
                <InputField name="password" placeholder="password" label='Password' type='password' />
              </Box>
              <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >login</Button>
            </Form>
          )
        }
      </Formik>

    </Wrapper>
  );
}


export default withUrqlClient(createUrqlClient)(Login) 