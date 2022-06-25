import {MigrationInterface, QueryRunner} from "typeorm";

export class Logging1645859481660 implements MigrationInterface {
    name = 'Logging1645859481660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "land_transfer" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "land_transfer" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "land_ownership" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "land_ownership" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transfer_to_land_record" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transfer_to_land_record" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "upvote" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "upvote" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upvote" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "upvote" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "transfer_to_land_record" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "transfer_to_land_record" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "land_ownership" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "land_ownership" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "land_transfer" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "land_transfer" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "block_chain_transaction" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "fee_transaction" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "amount_per_player" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    }

}
