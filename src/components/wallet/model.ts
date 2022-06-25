import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, getManager } from 'typeorm';
import { Ledger, RecordType } from '../ledger/model';
import { TransactionStatus } from '../transactions/model';
import { User } from '../users/model';

@Entity()
export class Wallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @OneToOne(() => User, user => user.wallet)
    @JoinColumn()
    user!: User;

    @Column('float', { nullable: false })
    balance!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static getOrCreate = async (user: User) => {
        await Wallet.createQueryBuilder()
            .insert()
            .values({ user: user, balance: 0 })
            .orIgnore()
            .execute();

        return Wallet.findOneOrFail({ user: user });
    }
}

@Entity()
export class WithdrawlWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @ManyToOne(type => User, user => user.withdrwalWallet)
    user!: User;

    @Column('float', { nullable: false })
    amount!: number;

    @Column({ 
		type: "enum",
        enum: TransactionStatus,
        default: TransactionStatus.PENDING
	})
	status?: string;

    @Column("varchar", {
		nullable: true 
	})
	transaction_hash?: string; // for nullable fields

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static withdrawAllAmount = async (user: User) => {
        const wallet = await Wallet.getOrCreate(user)
        if(wallet.balance == 0){
            throw new Error("Not sufficient balance in wallet!")
        }
        else{

            await getManager().transaction(async transactionalEntityManager => {

                const amount = wallet.balance
                wallet.balance = 0

                const withdrawl = WithdrawlWallet.create({
                    user: user,
                    amount: amount,
                    status: TransactionStatus.PROCESSING
                })

                const ledger = Ledger.create({
                    userId: user.id,
                    amount: amount,
                    type: RecordType.TRANSFER_TO_WALLET
                })

                await transactionalEntityManager.save(wallet)
                await transactionalEntityManager.save(withdrawl)
                await transactionalEntityManager.save(ledger)
    
            });

        }

    }


}