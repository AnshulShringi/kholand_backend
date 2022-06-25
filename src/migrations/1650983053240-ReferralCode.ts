import {MigrationInterface, QueryRunner} from "typeorm";

export class ReferralCode1650983053240 implements MigrationInterface {
    name = 'ReferralCode1650983053240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "referralCode" character varying(6)`);
        await queryRunner.query(`UPDATE "user" u SET "referralCode" = urc.updateReferralCode FROM (SELECT id, SUBSTRING(UPPER(gen_random_uuid()::text),1,6) updateReferralCode FROM "user") urc WHERE u.id = urc.id`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "referralCode" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_bf0e513b5cd8b4e937fa0702311" UNIQUE ("referralCode")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_bf0e513b5cd8b4e937fa0702311"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "referralCode"`);
    }

}
