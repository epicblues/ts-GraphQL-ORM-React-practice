import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// m to n
// many to many
// user <-> posts
// several users can upvote same posts
// user -> updoot <- post

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  // is this up or down
  // positive : up / negative : down
  @Field(() => Int!)
  @Column({ type: "int" })
  value: number;

  // Primary Generated Column 필요 x
  // Primary Column based on Foreign Key
  // 2개의 primary key => userId + postId
  @Field(() => Int!)
  @PrimaryColumn({ type: "int" })
  userId: number;

  @Field(() => Int!)
  @PrimaryColumn({ type: "int" })
  postId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.updoots)
  post: Post;
}
