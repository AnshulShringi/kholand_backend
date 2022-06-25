import {MigrationInterface, QueryRunner} from "typeorm";

export class FcmTokenColumnSize1652889214724 implements MigrationInterface {
    name = 'FcmTokenColumnSize1652889214724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" character varying(300)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" character varying(50)`);
    }

}
