import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711843200000 implements MigrationInterface {
  name = 'InitialSchema1711843200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM ('director', 'corper', 'supervisor');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "year" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_year" UNIQUE ("year")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sessionId" uuid NOT NULL,
        "matricNo" character varying NOT NULL,
        "surname" character varying NOT NULL,
        "otherNames" character varying NOT NULL,
        "name" character varying NOT NULL,
        "department" character varying,
        "faculty" character varying,
        "course" character varying,
        "level" character varying NOT NULL,
        "state" character varying NOT NULL,
        "lga" character varying,
        "industry" character varying,
        "location" character varying,
        "email" character varying,
        "phone" character varying,
        "gender" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_students_matric_session" UNIQUE ("matricNo", "sessionId"),
        CONSTRAINT "FK_students_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "supervisorId" uuid NOT NULL,
        "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assignments_studentId" UNIQUE ("studentId"),
        CONSTRAINT "FK_assignments_student" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assignments_supervisor" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scores" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "studentId" uuid NOT NULL,
        "orientation" integer,
        "supervisorScore" integer,
        "industryScore" integer,
        "enteredById" uuid,
        "isDraft" boolean NOT NULL DEFAULT false,
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scores_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_scores_studentId" UNIQUE ("studentId"),
        CONSTRAINT "FK_scores_student" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_scores_enteredBy" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_sessionId" ON "students" ("sessionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_students_name" ON "students" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assignments_supervisorId" ON "assignments" ("supervisorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_assignments_supervisorId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_sessionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}
