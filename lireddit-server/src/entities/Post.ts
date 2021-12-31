import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {
  @PrimaryKey()
  id!: number;
  // non-null/non-undefined operator

  @Property({ type: "date" }) // type을 정해주지 않으면 bson 등 의도하지 않는 type으로 import 된다.
  // database column임을 알려주는 decorator
  createdAt = new Date();

  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ type: "text" })
  title!: string;
}
