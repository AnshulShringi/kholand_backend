import {MigrationInterface, QueryRunner} from "typeorm";

export class FcmTokenColumn1652885037156 implements MigrationInterface {
    name = 'FcmTokenColumn1652885037156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
    }

}
