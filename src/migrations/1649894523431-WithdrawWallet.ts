import {MigrationInterface, QueryRunner} from "typeorm";

export class WithdrawWallet1649894523431 implements MigrationInterface {
    name = 'WithdrawWallet1649894523431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."withdrawl_wallet_status_enum" AS ENUM('pending', 'processing', 'success', 'invalid')`);
        await queryRunner.query(`CREATE TABLE "withdrawl_wallet" ("id" SERIAL NOT NULL, "amount" double precision NOT NULL, "status" "public"."withdrawl_wallet_status_enum" NOT NULL DEFAULT 'pending', "transaction_hash" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_2b11d976021911c12ef41d7c70d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "withdrawl_wallet" ADD CONSTRAINT "FK_a69572a7e77c28581fad1ad4b72" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawl_wallet" DROP CONSTRAINT "FK_a69572a7e77c28581fad1ad4b72"`);
        await queryRunner.query(`DROP TABLE "withdrawl_wallet"`);
        await queryRunner.query(`DROP TYPE "public"."withdrawl_wallet_status_enum"`);
    }

}
