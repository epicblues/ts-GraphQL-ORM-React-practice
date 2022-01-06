import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @Column({ unique: true }) // type을 입력하지 않으면 기본적으로 text 형태로 저장
  username!: string;

  @Field(() => String)
  @Column({ unique: true })
  email!: string;

  @Column() // @Field Decorator 사용 x; 노출시킬 필요가 없다.
  password!: string;
}
