import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, getManager } from "typeorm";
import {FutureError} from '../exceptions/FutureError';
import { Ledger, MetaData, RecordType } from "../ledger/model";

export enum PassType {
    BATTERY = "battery",
	INVALID = "invalid"
}

@Entity()
export class Pass extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number; // Note that the `null assertion` `!` is required in strict mode.

	@Column("integer", { 
		nullable: false 
	})
	userId!: number;

	@Column({ 
		type: "enum",
        enum: PassType,
        default: PassType.INVALID
	})
	type!: string;

	@Column("float", { 
		nullable: false 
	})
	batteryLeft!: number;

	@Column("float", { 
		nullable: false 
	})
	passLimit!: number;

	@CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

	static renewOrCreateBattery = async (userId: number, referralRenew = false) => {
        let pass = await Pass.findOne({ userId: userId, type: PassType.BATTERY });
		const passLimit = 10;
        if (pass == undefined) {
            pass = Pass.create();
            pass.userId = userId;
            pass.type = PassType.BATTERY;
			pass.passLimit = passLimit;
			pass.batteryLeft = 0;
        }
		// if user is gaining pass through referral, for now we will be crediting more than the limit
		// TODO: rethink pass and battery logic
		if (referralRenew == true) {
			pass.batteryLeft += 10
			pass.save();
			return pass;
		}
		else {
			if (pass.batteryLeft != 0) {
				throw new FutureError("Passes can be recharged only when empty");
			}
			else {
				pass.batteryLeft = pass.passLimit;
				pass.save();
				return pass;
			}
		}
	}

    static getForUser = async (userId: number, type: PassType) => {
        return await Pass.findOne({ userId: userId, type: type });
	}

	static deductBattery = async (userId: number, deductionAmount: number) => {

		await getManager().transaction(async transactionalEntityManager => {

			let pass = await Pass.findOne({ userId: userId, type: PassType.BATTERY })
			if (pass == undefined) {
				throw new FutureError("Pass not found for user");
			}
			if (pass.batteryLeft < deductionAmount) {
				throw new FutureError("User doesn't have enough charge");
			}
			pass.batteryLeft -= deductionAmount;

			const ledger = Ledger.create({
				userId: userId,
				amount: deductionAmount,
				type: RecordType.GAME_PAYMENT,
				metadata: MetaData.LUDO
			})

			await transactionalEntityManager.save(pass)
			await transactionalEntityManager.save(ledger)
		});
		
	}
}