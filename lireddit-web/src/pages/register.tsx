import react from 'react'
import { Form, Formik } from 'formik'
import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useMutation } from 'urql'

interface registerProps {

}

// graphql query를 복사, $로 시작하는 것은 변수명으로 parsing 하는 듯
const REGISTER_MUT = `mutation Register($username: String!, $password: String!) {
  register(options: { username: $username, password: $password }) {
    errors {
      field
      message
    }
    user {
      id
    	createdAt
    }
  }
}
`

const Register: React.FC<registerProps> = ({ }) => {
  // graphql 요청용 라이브러리
  // key value pair를 받아서 $변수명에 값을 대입한다.
  const [, register] = useMutation(REGISTER_MUT);


  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={values => {
          console.log(values);
          return register(values); // promise 객체를 return 하면 submitting 상태 false로 변화
        }}>
        {
          ({ isSubmitting }) => (
            <Form>
              <InputField name="username" placeholder="username" label='Username' />
              <Box mt={4}>
                <InputField name="password" placeholder="password" label='Password' type='password' />
              </Box>
              <Button mt={4} type="submit" bgColor={"teal"} color="white" isLoading={isSubmitting} >register</Button>
            </Form>
          )
        }
      </Formik>

    </Wrapper>
  );
}


export default Register;