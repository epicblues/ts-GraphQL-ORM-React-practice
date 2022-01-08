import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ unique: true }) // type을 입력하지 않으면 기본적으로 text 형태로 저장
  username!: string;

  @Field(() => String)
  @Column({ unique: true })
  email!: string;

  @Column() // @Field Decorator 사용 x; 노출시킬 필요가 없다.
  password!: string;

  // post와 일대 다 관계
  @Field(() => [Post])
  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Updoot])
  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];
}
