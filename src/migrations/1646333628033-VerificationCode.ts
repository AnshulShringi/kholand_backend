import {MigrationInterface, QueryRunner} from "typeorm";

export class VerificationCode1646333628033 implements MigrationInterface {
    name = 'VerificationCode1646333628033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "verification_code" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "code" character varying(120) NOT NULL, "expiryTimestamp" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_59d1a0ba0cb807a8c9993f066dc" UNIQUE ("code"), CONSTRAINT "PK_d702c086da466e5d25974512d46" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "verification_code"`);
    }

}
