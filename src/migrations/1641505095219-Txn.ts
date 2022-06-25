import {MigrationInterface, QueryRunner} from "typeorm";

export class Txn1641505095219 implements MigrationInterface {
    name = 'Txn1641505095219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "amount_per_player" ("id" SERIAL NOT NULL, "amount" integer NOT NULL DEFAULT '0', "userId" integer, CONSTRAINT "REL_8b94bd8284cf8ece8cf4d728ca" UNIQUE ("userId"), CONSTRAINT "PK_f55c55d943d8fbfb68db243a817" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fee_transaction" ("id" SERIAL NOT NULL, "amount" integer NOT NULL DEFAULT '0', "sender" character varying NOT NULL, "isRecored" boolean NOT NULL DEFAULT false, "amountPerPlayerId" integer, CONSTRAINT "PK_baa3ca4933b0e50dce6dd5b5687" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "block_chain_transaction" ("id" SERIAL NOT NULL, "nonce" integer NOT NULL DEFAULT '0', "amount" integer NOT NULL DEFAULT '0', "recevier" character varying NOT NULL, "sender" character varying NOT NULL, "reason" character varying, "status" character varying NOT NULL DEFAULT 'pending', "blockNumber" integer NOT NULL DEFAULT '0', "isRecored" boolean NOT NULL DEFAULT false, "isTransferEventRecored" boolean NOT NULL DEFAULT false, "amountPerPlayerId" integer, CONSTRAINT "PK_3172d9deb7138e0e9a249265749" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" ADD CONSTRAINT "FK_8b94bd8284cf8ece8cf4d728ca3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD CONSTRAINT "FK_62752748445000b8644aaed9974" FOREIGN KEY ("amountPerPlayerId") REFERENCES "amount_per_player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" ADD CONSTRAINT "FK_efa4c67f38fa38e3caeb9f2937c" FOREIGN KEY ("amountPerPlayerId") REFERENCES "amount_per_player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" DROP CONSTRAINT "FK_efa4c67f38fa38e3caeb9f2937c"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP CONSTRAINT "FK_62752748445000b8644aaed9974"`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" DROP CONSTRAINT "FK_8b94bd8284cf8ece8cf4d728ca3"`);
        await queryRunner.query(`DROP TABLE "block_chain_transaction"`);
        await queryRunner.query(`DROP TABLE "fee_transaction"`);
        await queryRunner.query(`DROP TABLE "amount_per_player"`);
    }

}
