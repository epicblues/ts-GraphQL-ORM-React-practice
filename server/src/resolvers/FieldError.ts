import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  // 어느 필드에 에러가 있는가
  @Field()
  message: string;
}
