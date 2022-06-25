import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1641499878137 implements MigrationInterface {
    name = 'InitialMigration1641499878137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction" ("id" SERIAL NOT NULL, "nonce" integer NOT NULL DEFAULT '0', "amount" integer NOT NULL DEFAULT '0', "recevier" character varying NOT NULL, "sender" character varying NOT NULL, "reason" character varying, "status" character varying NOT NULL DEFAULT 'pending', CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "nonce" integer NOT NULL, "publicAddress" character varying(120) NOT NULL, "email" character varying(120), CONSTRAINT "UQ_764606159294aeed20628413590" UNIQUE ("publicAddress"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
    }

}
