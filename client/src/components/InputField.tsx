import { FormControl, FormLabel, Input, FormErrorMessage, Textarea } from '@chakra-ui/react';
import { FieldHookConfig, useField } from 'formik';
import react, { HTMLInputTypeAttribute } from 'react'

type InputFieldProps = FieldHookConfig<HTMLInputTypeAttribute> & { label?: string }



export const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => {
  const [field, { error }] = useField(props)
  return (
    <FormControl isInvalid={!!error}>
      {/* !!value => casting value to boolean */}
      {label && <FormLabel htmlFor={field.name}>{label}</FormLabel>}
      {props.type === "textarea" ?
        <Textarea {...field} id={field.name} placeholder={props.placeholder} /> :
        <Input {...field} type={props.type} id={field.name} placeholder={props.placeholder} />

      }
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}