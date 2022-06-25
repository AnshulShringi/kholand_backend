import {MigrationInterface, QueryRunner} from "typeorm";

export class CharacterId1645302199293 implements MigrationInterface {
    name = 'CharacterId1645302199293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "characterId" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "nickname" character varying(30)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "nickname"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "characterId"`);
    }

}
