import {MigrationInterface, QueryRunner} from "typeorm";

export class ReferralRewardLedger1651553617348 implements MigrationInterface {
    name = 'ReferralRewardLedger1651553617348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ledger_type_enum" RENAME TO "ledger_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ledger_type_enum" AS ENUM('game_payment', 'game_reward', 'transfer_to_wallet', 'referral_reward')`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" TYPE "public"."ledger_type_enum" USING "type"::"text"::"public"."ledger_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ledger_type_enum_old" AS ENUM('game_payment', 'game_reward', 'transfer_to_wallet')`);
        await queryRunner.query(`ALTER TABLE "ledger" ALTER COLUMN "type" TYPE "public"."ledger_type_enum_old" USING "type"::"text"::"public"."ledger_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ledger_type_enum_old" RENAME TO "ledger_type_enum"`);
    }

}
