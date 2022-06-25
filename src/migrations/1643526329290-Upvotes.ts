import {MigrationInterface, QueryRunner} from "typeorm";

export class Upvotes1643526329290 implements MigrationInterface {
    name = 'Upvotes1643526329290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "upvote" ("id" SERIAL NOT NULL, "count" integer NOT NULL DEFAULT '0', "game" character varying(120) NOT NULL, CONSTRAINT "UQ_dbae486fdc2fa8c4056f41af807" UNIQUE ("game"), CONSTRAINT "PK_e63693403e030d3e060747dd776" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "upvote"`);
    }

}
