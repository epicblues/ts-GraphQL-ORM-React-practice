import { readFileSync } from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";

export class FakePosts1641513725730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const statements = readFileSync(path.resolve("post.sql"))
        .toString()
        .split(/(?<=;)\n(?=insert)/);
      // 정규 표현식(lookahead / lookbehind)을 사용하면 split을 할 때 패턴을 삭제하지 않는다.
      for (let statement of statements) {
        if (statement.length === 0) continue;
        await queryRunner.query(statement);
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async down(): Promise<void> {}
}
