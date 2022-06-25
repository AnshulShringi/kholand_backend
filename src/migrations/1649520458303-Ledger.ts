import {MigrationInterface, QueryRunner} from "typeorm";

export class Ledger1649520458303 implements MigrationInterface {
    name = 'Ledger1649520458303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ledger_type_enum" AS ENUM('game_payment', 'game_reward', 'transfer_to_wallet', 'invalid')`);
        await queryRunner.query(`CREATE TABLE "ledger" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "amount" double precision NOT NULL, "type" "public"."ledger_type_enum" NOT NULL DEFAULT 'invalid', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a322e9157e5f42a16750ba2a20" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ledger"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_type_enum"`);
    }

}
