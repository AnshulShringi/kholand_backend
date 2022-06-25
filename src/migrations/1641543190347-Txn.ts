import {MigrationInterface, QueryRunner} from "typeorm";

export class Txn1641543190347 implements MigrationInterface {
    name = 'Txn1641543190347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" ADD "txnAddress" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" ADD CONSTRAINT "UQ_68d3e244a1488ce8100e4dcd0fd" UNIQUE ("txnAddress")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" DROP CONSTRAINT "UQ_68d3e244a1488ce8100e4dcd0fd"`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" DROP COLUMN "txnAddress"`);
    }

}
