import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Entity } from "typeorm/decorator/entity/Entity";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType() // stacked Decorator - class 이므로 type-graphql에서 사용하는 type으로도 간주 가능
@Entity()
export class Post extends BaseEntity {
  // baseEntity : 해당 클래스의 정적 메서드로 db와 CRUD 가능

  @Field(() => Int) // graphql용 decorator 선언하지 않으면 graphql로 해당 필드를 읽을 수 없다.
  // 즉 노출되고 싶은 Field만 decorator로 선언하면 된다.
  @PrimaryGeneratedColumn()
  id!: number;
  // non-null/non-undefined operator

  @Field(() => String)
  @Column({ type: "text" })
  title!: string;

  @Field(() => String)
  @Column({ type: "text" })
  text!: string;

  @Field(() => Int)
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field(() => Int)
  @Column()
  creatorId: number;

  // database에 user.id와 연결된 foreign key 설정
  // db 테이블에 직접 만들어지는 것은 아니고
  // inner join을 할 때 nested 한 상태로 들어온다
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field(() => [Updoot])
  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  @Field(() => String)
  @CreateDateColumn() // 생성된 시점을 날짜로 저장해주는 typeORM의 decorator
  createdAt: Date; // 필드 기본 값을 설정할 필요가 없어졌다.

  @Field(() => String)
  @UpdateDateColumn() // 갱신된 시점을 날짜로 저장해주는 typeORM의 decorator
  updatedAt: Date;
}
