import {MigrationInterface, QueryRunner} from "typeorm";

export class PassMetadata1649686989495 implements MigrationInterface {
    name = 'PassMetadata1649686989495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ledger" ADD "metadata" character varying`);
        await queryRunner.query(`UPDATE "ledger" SET type = 'game_payment' where type='invalid'`);
        await queryRunner.query(`ALTER TYPE "public"."ledger_type_enum" RENAME TO "ledger_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ledger_type_enum" AS ENUM('game_payment', 'game_reward', 'transfer_to_wallet')`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" TYPE "public"."ledger_type_enum" USING "type"::"text"::"public"."ledger_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ledger_type_enum_old" AS ENUM('game_payment', 'game_reward', 'transfer_to_wallet', 'invalid')`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" TYPE "public"."ledger_type_enum_old" USING "type"::"text"::"public"."ledger_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" SET DEFAULT 'invalid'`);
        await queryRunner.query(`DROP TYPE "public"."ledger_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ledger_type_enum_old" RENAME TO "ledger_type_enum"`);
        await queryRunner.query(`ALTER TABLE "ledger" DROP COLUMN "metadata"`);
    }

}
