import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType() // stacked Decorator - class 이므로 type-graphql에서 사용하는 type으로도 간주 가능
@Entity()
export class Post {
  @Field(() => Int) // graphql용 decorator 선언하지 않으면 graphql로 해당 필드를 읽을 수 없다.
  // 즉 노출되고 싶은 Field만 decorator로 선언하면 된다.
  @PrimaryKey()
  id!: number;
  // non-null/non-undefined operator

  @Field(() => String)
  @Property({ type: "date" }) // type을 정해주지 않으면 bson 등 의도하지 않는 type으로 import 된다.
  // database column임을 알려주는 decorator
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field(() => String)
  @Property({ type: "text" })
  title!: string;
}
