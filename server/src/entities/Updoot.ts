import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// m to n
// many to many
// user <-> posts
// several users can upvote same posts
// user -> updoot <- post

// graphql에서는 사용하지 않을 것이므로 ObjectType에 넣지 않는다.
@Entity()
export class Updoot extends BaseEntity {
  // is this up or down
  // positive : up / negative : down
  @Column({ type: "int" })
  value: number;

  // Primary Generated Column 필요 x
  // Primary Column based on Foreign Key
  // 2개의 primary key => userId + postId
  @PrimaryColumn({ type: "int" })
  userId: number;

  @PrimaryColumn({ type: "int" })
  postId: number;

  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @ManyToOne(() => Post, (post) => post.updoots)
  post: Post;
}
