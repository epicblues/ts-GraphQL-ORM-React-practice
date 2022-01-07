import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

interface ForgotPasswordProps {

}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ }) => {
  const [, sendEmail] = useForgotPasswordMutation()
  const [complete, setComplete] = useState(false);
  const router = useRouter()
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (values, { setErrors, }) => {
          const response = await sendEmail(values);
          if (response.data?.forgotPassword.valueOf()) {

            setComplete(true);

          } else {
            setErrors({ email: "Server Error" })
          }

        }}>
        {
          ({ isSubmitting }) => complete ? (
            <Box>
              If an account with that email exists, we sent you an email
            </Box>) : (
            <Form>
              <Box mt={4}>
                <InputField name="email" placeholder="email" label='Email' type='email' />
              </Box>
              <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >submit</Button>
            </Form>
          )
        }
      </Formik>

    </Wrapper>
  );
}



export default withUrqlClient(createUrqlClient)(ForgotPassword);