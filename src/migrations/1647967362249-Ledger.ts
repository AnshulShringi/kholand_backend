import {MigrationInterface, QueryRunner} from "typeorm";

export class Ledger1647967362249 implements MigrationInterface {
    name = 'Ledger1647967362249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."token_ledger_status_enum" AS ENUM('pending', 'processing', 'success', 'invalid')`);
        await queryRunner.query(`CREATE TABLE "token_ledger" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "count" double precision NOT NULL, "status" "public"."token_ledger_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92047e999ae4cc74b08c6037e07" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "token_ledger"`);
        await queryRunner.query(`DROP TYPE "public"."token_ledger_status_enum"`);
    }

}
