import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Entity } from "typeorm/decorator/entity/Entity";

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
  @CreateDateColumn() // 생성된 시점을 날짜로 저장해주는 typeORM의 decorator
  createdAt: Date; // 필드 기본 값을 설정할 필요가 없어졌다.

  @Field(() => String)
  @UpdateDateColumn() // 갱신된 시점을 날짜로 저장해주는 typeORM의 decorator
  updatedAt: Date;

  @Field(() => String)
  @Column()
  title!: string;
}
