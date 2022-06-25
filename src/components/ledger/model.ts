import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/model';
import { Wallet } from '../wallet/model';

export enum RecordType {
    GAME_PAYMENT = "game_payment",
    GAME_REWARD = "game_reward",
    TRANSFER_TO_WALLET = "transfer_to_wallet",
    REFERRAL_REWARD = "referral_reward"
}

export enum MetaData {
    LUDO = "Ludo"
}

@Entity()
export class Ledger extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @Column('integer', { nullable: false })
    public userId!: number;

    @Column('float', { nullable: false })
    public amount!: number;

    @Column({
        type: "enum",
        enum: RecordType,
        nullable: false
    })
    type!: string;

    @Column('varchar', {nullable: true })
    public metadata?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static record = async (userId: number, amount: number, type: RecordType, metadata: string) => {
        let record = Ledger.create();
        let wallet = await Wallet.findOne({
            where: {
                user: 2
            }
        });
        if (!wallet) {
            let user = await User.findOneOrFail(userId);
            wallet = await Wallet.getOrCreate(user);
        }
        if (wallet.balance + amount < 0) {
            throw new Error("Not sufficient balance in wallet!")
        }
        record.userId = userId;
        record.amount = amount;
        record.type = type;
        record.metadata = metadata;
        record.save();

        wallet.balance += amount;
        wallet.save();
    }
}

