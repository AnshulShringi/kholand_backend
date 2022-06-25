import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne, getManager, JoinColumn } from "typeorm";
import { recoverPersonalSignature } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';
import jwt from 'jsonwebtoken';
import { generateRandomNickName } from "../../utils";

import { config } from '../../config';
import { AmountPerPlayer, LandOwnership } from "../transactions/model";

import { Pass, PassType } from "../passes/model";
import { Wallet, WithdrawlWallet } from "../wallet/model";
import { Ledger, RecordType } from "../ledger/model";

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number; // Note that the `null assertion` `!` is required in strict mode.

	@Column("int", { 
		nullable: false 
	})
	nonce!: number;

	@Column("varchar", {
		unique: true,
		length: 120,
		nullable: false 
	})
	publicAddress!: string;

	@Column("varchar", {
		length: 120,
		nullable: true 
	})
	email?: string; // for nullable fields

	@Column("varchar", {
		length: 30,
		nullable: true 
	})
	characterId?: string; // for nullable fields

	@Column("varchar", {
		length: 30,
		nullable: true 
	})
	nickname?: string; // for nullable fields

	@Column("boolean", {
		default: false,
		nullable: false 
	})
	verified!: boolean;

	@OneToMany(type => LandOwnership, landowner => landowner.user)
	landowner!: LandOwnership;

	@Column({ type: "timestamp", nullable: true })
	lastLogin?: Date

	@Column("varchar", {
		length: 20,
		nullable: true
	})
	phoneNumber?: string;

	@OneToMany(() => UserLog, userLog => userLog.user)
	logs?: UserLog[]

	@OneToOne(() => Wallet, wallet => wallet.user)
	wallet?: Wallet;

	@OneToMany( type => WithdrawlWallet , txn => txn.user)
    withdrwalWallet!: WithdrawlWallet[];

	@Column("varchar", { length: 6, nullable: false, unique: true })
	referralCode!: string

	@CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

	@Column("varchar", {
		length: 300,
		nullable: true 
	})
	fcmToken?: string; // for nullable fields

	static getOrCreate = async (publicAddress:string) => {

		return await getManager().transaction(async transactionalEntityManager => {
			const nonce = Math.floor(Math.random() * 10000);
			const referralCode = (Math.random() + 1).toString(36).substring(2, 8).toUpperCase()
			const result = await transactionalEntityManager.upsert(User, {
				publicAddress: publicAddress,
				nonce: nonce,
				referralCode: referralCode,
			},  ["publicAddress"])

			const createdUser = await transactionalEntityManager.findOneOrFail(User, {publicAddress: publicAddress})
			console.log("CreatedUser", createdUser)

			if(!createdUser.nickname || createdUser.nickname.length == 0){
				const randomName = generateRandomNickName()
				createdUser.nickname = randomName
				await transactionalEntityManager.save(createdUser)
			}

			const bb = await  transactionalEntityManager.findOne(AmountPerPlayer, {user: createdUser})
			console.log("AmountPerPlayer", bb)
			if(bb==undefined){
				const aa = AmountPerPlayer.create()
				aa.user = createdUser
				await transactionalEntityManager.save(aa)
			}

			const pass = await Pass.getForUser(createdUser.id, PassType.BATTERY)
			if(!pass){
				await Pass.renewOrCreateBattery(createdUser.id)
			}

			const count = result.identifiers.length;
			if(count!==1){
				throw new Error(
					`Error nonce created for ${count} but should be for one.`
				);
			}
			return await transactionalEntityManager.findOneOrFail(User, result.identifiers[0].id)
		});		
	}

	generateAccessToken = async (signature:string, ipAddress: string | undefined) => {
		////////////////////////////////////////////////////
		// Step 1: Verify digital signature
		////////////////////////////////////////////////////
		const msg = `I am signing my one-time nonce: ${this.nonce}`;

		// We now are in possession of msg, publicAddress and signature. We
		// will use a helper from eth-sig-util to extract the address from the signature
		const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
		const address = recoverPersonalSignature({
			data: msgBufferHex,
			sig: signature,
		});

		// The signature verification is successful if the address found with
		// sigUtil.recoverPersonalSignature matches the initial publicAddress
		if (address.toLowerCase() !== this.publicAddress.toLowerCase()) {
			throw new Error(
				'Signature verification failed'
			);
		}

		////////////////////////////////////////////////////
		// Step 2: Generate a new nonce for the user
		////////////////////////////////////////////////////
		this.nonce = Math.floor(Math.random() * 10000);

		////////////////////////////////////////////////////
		// Step 3: Create JWT
		////////////////////////////////////////////////////
		const accessToken = await new Promise<string>((resolve, reject) =>
			// https://github.com/auth0/node-jsonwebtoken
			jwt.sign(
				{
					payload: {
						id: this.id,
						publicAddress: this.publicAddress,
					},
				},
				config.secret,
				{
					algorithm: config.algorithms[0],
				},
				(err, token) => {
					if (err) {
						return reject(err);
					}
					if(!token || token==null){
						return new Error('Empty token');
					}
					return resolve(token);
				}
			)
		);

		////////////////////////////////////////////////////
		// Step 3: Create UserLog and change lastLogin
		////////////////////////////////////////////////////
		const userLog = await UserLog.create({
			user: this,
			ipAddress: ipAddress
		}).save()

		this.lastLogin = userLog.createdAt;
		await this.save()

		return accessToken;
	}
}


@Entity()
export class UserLog extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => User, user => user.logs)
	user!: User

	@Column("varchar", {
		length: 45,
		nullable: false
	})
	ipAddress!: string;

	@CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity()
export class VerificationCode extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number; // Note that the `null assertion` `!` is required in strict mode.

	@Column("int", { 
		nullable: false 
	})
	userId!: number;

	@Column("varchar", {
		unique: true,
		length: 120,
		nullable: false 
	})
	code!: string;

	@Column({ type: "timestamp", nullable: false })
	expiryTimestamp!: Date;

	@CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

	static createObject = (userId: number, code: string) => {
		const verificationCode = VerificationCode.create();
		verificationCode.userId = userId;
		verificationCode.code = code;
		const currTime = new Date();
		// Expiry timestamp is 30 minutes from currentTime
		const expiryTimestamp = new Date(currTime.getTime() + 30 * 60 * 1000);
		verificationCode.expiryTimestamp = expiryTimestamp;
		return verificationCode;
	}
}

@Entity()
export class Referral extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@OneToOne(() => User)
	@JoinColumn()
	referredUser !: User;

	@ManyToOne(() => User)
	referrerUser !: User;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;

	static addReferralCode = async (referredUser: User, referralCode: string) => {
		// Check if user has already added a referral code
		const referredUserCheck = await Referral.findOne({
			where: {
				referredUser: referredUser
			}
		})
		if (referredUserCheck != null) {
			throw new Error('referral code already entered')
		}

		// Check for correct referral code, i.e. matches another users referral code
		const referrerUser = await User.findOne({
			where: {
				referralCode: referralCode
			}
		})
		if (referrerUser == null) {
			throw new Error('Incorrect referral code')
		}
		if (referrerUser.id == referredUser.id) {
			throw new Error('Cannot enter self referral code')
		}

		// Check that referred account is created later than referrer account to prevent cyclic referring
		if (referredUser.createdAt < referrerUser.createdAt) {
			throw new Error('Older account cannot enter referral code of newer accounts')
		}

		await getManager().transaction(async transactionalEntityManager => {
			const referral = Referral.create({
				referredUser: referredUser,
				referrerUser: referrerUser
			})
			transactionalEntityManager.save(referral)
			await Pass.renewOrCreateBattery(referrerUser.id, true)

			// temporary. refactor code in ledger.
			const ledger = Ledger.create({
				userId: referrerUser.id,
				amount: 10,
				type: RecordType.REFERRAL_REWARD,
				metadata: referredUser.id.toString()
			})
			ledger.save()
		})

		return Referral.findOneOrFail({
			where: {
				referredUser: referredUser,
				referrerUser: referrerUser
			}
		})
	}
}
