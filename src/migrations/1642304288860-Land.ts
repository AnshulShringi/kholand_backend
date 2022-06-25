import {MigrationInterface, QueryRunner} from "typeorm";

export class Land1642304288860 implements MigrationInterface {
    name = 'Land1642304288860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "land_transfer" ("id" SERIAL NOT NULL, "nonce" integer NOT NULL DEFAULT '0', "recevier" character varying NOT NULL, "sender" character varying NOT NULL, "tokenId" character varying NOT NULL, "blockNumber" integer NOT NULL DEFAULT '0', "isTransferEventRecored" boolean NOT NULL DEFAULT false, "txnAddress" character varying NOT NULL, CONSTRAINT "UQ_ce291916aae2eab2a57d7612504" UNIQUE ("txnAddress"), CONSTRAINT "PK_f164cc2cf043eb73858fbe809e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "land_ownership" ("id" SERIAL NOT NULL, "landX" character varying NOT NULL, "landY" character varying NOT NULL, "tokenId" character varying NOT NULL, "userId" integer, CONSTRAINT "UQ_edcfbfdae8eaadeb632759e59af" UNIQUE ("landX"), CONSTRAINT "UQ_6a6b58f359f44c0fbc6eea6d16f" UNIQUE ("landY"), CONSTRAINT "UQ_7703594d8adf5959618825b1ad9" UNIQUE ("tokenId"), CONSTRAINT "UQ_dfafdfc691ae442201ba4182e2d" UNIQUE ("userId", "landX", "landY", "tokenId"), CONSTRAINT "PK_ffd0a6f03da92036dfc34710823" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transfer_to_land_record" ("id" SERIAL NOT NULL, "recevier" character varying NOT NULL, "sender" character varying NOT NULL, "ref" character varying NOT NULL, "blockNumber" integer NOT NULL DEFAULT '0', "txnAddress" character varying NOT NULL, CONSTRAINT "UQ_913a75c939fe50f9061416c1374" UNIQUE ("txnAddress"), CONSTRAINT "PK_7ee8c07507f9ef9cb920e3e9091" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD "recordHash" character varying`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD "landTokenId" character varying`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "land_ownership" ADD CONSTRAINT "FK_9e016f7e0efbc2703c8813bf16e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "land_ownership" DROP CONSTRAINT "FK_9e016f7e0efbc2703c8813bf16e"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP COLUMN "landTokenId"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP COLUMN "recordHash"`);
        await queryRunner.query(`DROP TABLE "transfer_to_land_record"`);
        await queryRunner.query(`DROP TABLE "land_ownership"`);
        await queryRunner.query(`DROP TABLE "land_transfer"`);
    }

}
