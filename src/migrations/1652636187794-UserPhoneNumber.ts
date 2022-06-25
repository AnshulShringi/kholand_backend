import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPhoneNumber1652636187794 implements MigrationInterface {
    name = 'UserPhoneNumber1652636187794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "phoneNumber" character varying(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
    }

}
