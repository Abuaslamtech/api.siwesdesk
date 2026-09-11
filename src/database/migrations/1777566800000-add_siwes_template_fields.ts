import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiwesTemplateFields1777566800000 implements MigrationInterface {
  name = 'AddSiwesTemplateFields1777566800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" ADD "whatsappNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "bankName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "accountName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "accountNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "sortCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "industrySupervisorName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "industrySupervisorPhone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "siwesDuration" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "siwesDuration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "industrySupervisorPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "industrySupervisorName"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "sortCode"`);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "accountNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "accountName"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "bankName"`);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "whatsappNumber"`,
    );
  }
}
