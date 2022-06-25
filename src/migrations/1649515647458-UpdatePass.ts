import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdatePass1649515647458 implements MigrationInterface {
    name = 'UpdatePass1649515647458'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."pass_type_enum" AS ENUM('battery', 'invalid')`);
        await queryRunner.query(`CREATE TABLE "pass" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" "public"."pass_type_enum" NOT NULL DEFAULT 'invalid', "batteryLeft" double precision NOT NULL, "passLimit" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f177d7f9a16271fab41c51876e4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "pass"`);
        await queryRunner.query(`DROP TYPE "public"."pass_type_enum"`);
    }

}
