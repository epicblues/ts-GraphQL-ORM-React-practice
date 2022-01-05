import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import router, { useRouter } from 'next/router';
import react from 'react'
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';
import register from '../register';



const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const [, changePassword] = useChangePasswordMutation()
  const router = useRouter()
  return (

    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors, }) => {
          const result = await changePassword({ newPassword: values.newPassword, token })
          if (result.data?.changePassword.user) {
            router.push('/login');
            return;
          }
          if (result.data?.changePassword.errors) {
            setErrors(toErrorMap(result.data.changePassword.errors));
            return;
          }

          // const response = await register({ options: values }); // promise 객체를 return 하면 submitting 상태 false로 변화
          // if (response.data?.register.errors) {
          //   // Optional Chaining 습관화 => 프로그램이 throw error 하는 것 방지

          //   setErrors(toErrorMap(response.data.register.errors))
          //   // 특정 input에 자동으로 mapping 되게 하는 formik 모듈 전용 에러 처리 함수)
          // } else if (response.data?.register.user) {
          //   router.push('/')
          // }
        }}>
        {
          ({ isSubmitting }) => (
            <Form>

              <Box mt={4}>
                <InputField name="newPassword" placeholder="new password" label='New Password' type='password' />
              </Box>
              <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >change password</Button>
            </Form>
          )
        }
      </Formik>

    </Wrapper>
  );
}


ChangePassword.getInitialProps = async ({ query }) => {
  return {
    token: query.token as string
  }
}

export default withUrqlClient(createUrqlClient)(ChangePassword); 