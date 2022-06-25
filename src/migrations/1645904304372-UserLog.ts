import {MigrationInterface, QueryRunner} from "typeorm";

export class UserLog1645904304372 implements MigrationInterface {
    name = 'UserLog1645904304372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_log" ("id" SERIAL NOT NULL, "ipAddress" character varying(45) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_eca046d4b8c20d9309b35f07b69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "lastLogin" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_log" ADD CONSTRAINT "FK_85f2dd25304ee3a9e43a5c5bcae" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_log" DROP CONSTRAINT "FK_85f2dd25304ee3a9e43a5c5bcae"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastLogin"`);
        await queryRunner.query(`DROP TABLE "user_log"`);
    }

}
