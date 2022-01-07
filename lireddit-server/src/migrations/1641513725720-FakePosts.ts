import { readFileSync } from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";

export class FakePosts1641513725727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // console.log(readFileSync(path.resolve("post.sql")).toString());
    const statements = readFileSync(path.resolve("post.sql"))
      .toString()
      .split(/(?<=;)\n/);
    // 정규 표현식(lookahead / lookbehind)을 사용하면 split을 할 때 패턴을 삭제하지 않는다.
    for (let statement of statements) {
      if (statement.length === 0) continue;
      await queryRunner.query(statement);
    }
  }

  public async down(): Promise<void> {}
}
