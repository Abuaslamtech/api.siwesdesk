import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777566629127 implements MigrationInterface {
    name = 'InitSchema1777566629127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" ADD "address" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "address"`);
    }

}
