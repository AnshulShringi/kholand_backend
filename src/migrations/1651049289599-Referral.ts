import {MigrationInterface, QueryRunner} from "typeorm";

export class Referral1651049289599 implements MigrationInterface {
    name = 'Referral1651049289599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "referral" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "referredUserId" integer, "referrerUserId" integer, CONSTRAINT "REL_b03e2e8eef2766e6ed730a86d6" UNIQUE ("referredUserId"), CONSTRAINT "PK_a2d3e935a6591168066defec5ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "FK_b03e2e8eef2766e6ed730a86d63" FOREIGN KEY ("referredUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "FK_3e5e9893e28eb9d78d062bc64f3" FOREIGN KEY ("referrerUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "FK_3e5e9893e28eb9d78d062bc64f3"`);
        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "FK_b03e2e8eef2766e6ed730a86d63"`);
        await queryRunner.query(`DROP TABLE "referral"`);
    }

}
