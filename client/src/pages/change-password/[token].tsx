import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import router, { useRouter } from 'next/router';
import react, { useState } from 'react'
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';
import NextLink from 'next/link'


const ChangePassword: NextPage<{}> = () => {
  const [, changePassword] = useChangePasswordMutation()
  const [tokenError, setTokenError] = useState('');
  const router = useRouter()
  // router를 통해 직접 query에 접근할 수 있다.
  // initialProps 등을 활용할 필요가 없다.
  const token = router.query.token as string;
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
            const errorMap = toErrorMap(result.data.changePassword.errors);
            if ('token' in errorMap) {
              // errorMap 객체에 'token' property가 존재할 때
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          }

        }}>
        {
          ({ isSubmitting }) => (
            <Form>

              <Box mt={4}>
                <InputField name="newPassword" placeholder="new password" label='New Password' type='password' />
              </Box>
              {tokenError && (
                <Flex color="red">
                  {tokenError}

                  <NextLink href="/forgot-password">
                    <Link ml={4}>Click here to get a new one</Link>
                  </NextLink>

                </Flex>)}
              <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >change password</Button>
            </Form>
          )
        }
      </Formik>

    </Wrapper>
  );
}



export default withUrqlClient(createUrqlClient)(ChangePassword); 