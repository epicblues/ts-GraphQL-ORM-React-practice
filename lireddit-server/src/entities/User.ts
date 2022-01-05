import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field(() => String)
  @Property({ unique: true, length: 30, type: "string" })
  username!: string;

  @Field(() => String)
  @Property({ type: "string", unique: true })
  email!: string;

  @Property({ type: "string" }) // @Field Decorator 사용 x; 노출시킬 필요가 없다.
  password!: string;
}
