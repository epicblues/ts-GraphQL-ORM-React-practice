import { Field, InputType } from "type-graphql";

@InputType() // 한 arg에 여러 필드를 넣을 수 있다.
export class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
}
