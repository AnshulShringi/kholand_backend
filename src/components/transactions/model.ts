import { CreateDateColumn, Double, QueryFailedError, UpdateDateColumn } from 'typeorm';
import { User } from '../users/model';

var Tx = require('ethereumjs-tx');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(process.env.INFURA_ADDRESS);
const web3 = new Web3(provider);

import FutureToken from "../../artifacts/abis/FutureToken.json"

import {
    Unique,
    Entity, BaseEntity, PrimaryGeneratedColumn, QueryRunner,
    Column, OneToOne, JoinColumn, In, ManyToOne, OneToMany, getConnection, getManager
} from "typeorm";
import {BigNumber} from "ethers";


@Entity()
@Unique(['user'])
export class AmountPerPlayer extends BaseEntity {
    @PrimaryGeneratedColumn()
	public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @OneToOne(type => User) @JoinColumn() 
	public user!: User;

    @Column('integer', {nullable: false, default:0 })
	public amount!: number;

    @OneToMany( type => FeeTransaction , txn => txn.amountPerPlayer)
    feeTxns!: FeeTransaction[];

    @OneToMany( type => BlockChainTransaction , txn => txn.amountPerPlayer)
    blockchainTxns!: BlockChainTransaction[];

    static getOrCreate = async (player:User) => {
        await AmountPerPlayer.createQueryBuilder()
            .insert()
            .values({user:player})
            .orIgnore()
            .execute();
        return AmountPerPlayer.findOneOrFail({user:player})
    }

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static recordFeeTxn = async (player:User, feeTxn:FeeTransaction) => {
        // whenever player is using consumable coins to play game.
        // this will decrease the amount.
        return AmountPerPlayer.findOneOrFail({user:player})
            .then(async (amountPerPlayer:AmountPerPlayer) => {
                await amountPerPlayer._executeTxn(async (queryRunner:QueryRunner)=>{
                    if(amountPerPlayer.amount < feeTxn.amount){
                        throw new Error(`Balance is low at ${amountPerPlayer.amount}`)
                    } 
                    feeTxn.isRecored = true;
                    amountPerPlayer.amount -= feeTxn.amount;
                    await queryRunner.manager.save(feeTxn);
                    await queryRunner.manager.save(amountPerPlayer);
                })

                return await AmountPerPlayer.findOneOrFail(amountPerPlayer.id);
            });
    }

    static recordBlockChainTxn = (player:User, blockChainTransaction:BlockChainTransaction) => {
        // whenever player is paying to game to get consumable coins.
        // this will increase the amount.
        return AmountPerPlayer.findOneOrFail({user:player})
            .then(async (amountPerPlayer:AmountPerPlayer) => {
                await amountPerPlayer._executeTxn(async (queryRunner:QueryRunner)=>{
                    blockChainTransaction.isRecored = true;
                    amountPerPlayer.amount += blockChainTransaction.amount;
                    await queryRunner.manager.save(blockChainTransaction);
                    console.log("Block chain txn saved")
                    await queryRunner.manager.save(amountPerPlayer);
                    console.log("Amount per player txn saved")
                });
                return await AmountPerPlayer.findOneOrFail(amountPerPlayer.id);
            })
    }

    _executeTxn = async (ops: (queryRunner:QueryRunner) => any) => {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();
        // lets now open a new transaction:
        await queryRunner.startTransaction();

        let gotError = null;

        try {
            // execute some operations on this transaction:
            await ops(queryRunner);
            // commit transaction now:
            await queryRunner.commitTransaction();
        } catch (err: any) {
            // since we have errors let's rollback changes we made
            gotError = err;
            await queryRunner.rollbackTransaction();
            
        } finally {
            // you need to release query runner which is manually created:
            await queryRunner.release();
            if(gotError){
                throw gotError;
            }
        }
    }
}


@Entity()
export class FeeTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
	id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @ManyToOne(type => AmountPerPlayer, amountPerPlayer => amountPerPlayer.feeTxns)
    amountPerPlayer!: AmountPerPlayer;

    @Column('integer', {nullable: false, default:0 })
	amount!: number;

    @Column('varchar', {nullable: false })
    sender!: string;

    @Column('boolean', {nullable: false, default:false })
    isRecored: boolean=false;

    @Column('varchar', {nullable: true})
    recordHash?: string;

    @Column('varchar', {nullable: true})
    landTokenId?: string;

    @Column('varchar', {default: 'pending', nullable: false})
    status: string = 'pending';  // ['pending', 'inflight', 'success', 'failed']

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static payoutLandOwners = async () => {
        const transaction = await FeeTransaction.findOne({status: 'pending'})
        if(transaction!=undefined){
            console.log("Before fetching")
            const landRecord = await LandOwnership.findOneOrFail({tokenId: transaction.landTokenId},
                {loadRelationIds: true})
            console.log("After fetching")
            console.log("Land Record",landRecord)

            //Here user is userid and not object
            // @ts-ignore
            const landOwnerUser = await User.findOneOrFail({id: landRecord.user })

            transaction.status = 'inflight'
            await transaction.save()

            await FeeTransaction.blockchainTxn(
                landOwnerUser.publicAddress,
                landRecord.landX,
                landRecord.landY,
                transaction.id.toString(),
                transaction.amount
            )
        }
    }

    static blockchainTxn = async (receiver: string, x: string, y: string, refId: string, amount: number) =>{
        const player = receiver;
        const masterAccount = process.env.OWNER_ACCOUNT;
        web3.eth.defaultAccount = masterAccount;
        const gamePrivateKey = Buffer.from(process.env.GAME_PRIVATE_KEY as string, 'hex');
        
        const abi = FutureToken.abi;
        const contractAddress = process.env.FUTURE_TOKEN_ADDRESS;
        const futureContract = new web3.eth.Contract(abi, contractAddress);
        const amountInWei = web3.utils.toWei(amount.toString())
        const txnData = futureContract.methods.gameToLandOwner(x,y,amountInWei,refId).encodeABI();

        const nonce = await web3.eth.getTransactionCount(masterAccount)

        // Build the transaction
        const txObject = {
            nonce:     web3.utils.toHex(nonce),
            to:       contractAddress,
            value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
            gasLimit: web3.utils.toHex(2100000),
            gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
            data:     txnData
        }
        // Sign the transaction
        const tx = new Tx(txObject);
        tx.sign(gamePrivateKey);
        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex');

        // Broadcast the transaction
        return await web3.eth.sendSignedTransaction(raw);
    }

}


@Entity()
export class BlockChainTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
	public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @ManyToOne(type => AmountPerPlayer, amountPerPlayer => amountPerPlayer.blockchainTxns)
    amountPerPlayer!: AmountPerPlayer;

    @Column('integer', {nullable: false, default:0 })
	public nonce!: number;

    @Column('integer', {nullable: false, default:0 })
	public amount!: number;

    @Column('varchar', {nullable: false })
    public recevier!: string;

    @Column('varchar', {nullable: false })
    public sender!: string;

    @Column('varchar', {nullable: true })
    public reason!: string;  // signon, game, ....

    @Column('varchar', {default: 'pending'})
	public status: string = 'pending';  // ['pending', 'inflight', 'success', 'failed']

    @Column('integer', {nullable: false, default:0 })
    public blockNumber: number=0;

    @Column('boolean', {nullable: false, default:false })
    public isRecored: boolean=false;

    @Column('boolean', {nullable: false, default:false })
    public isTransferEventRecored: boolean=false;

    @Column('varchar', {nullable: false, unique:true })
    public txnAddress!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static async createIfNotPresent(txnAddress:string, values:BlockChainTransaction) {
        await BlockChainTransaction.createQueryBuilder()
            .insert()
            .values({
                ...values,
                txnAddress: txnAddress
            })
            .orIgnore('txnAddress')
            .execute();
        return BlockChainTransaction.findOneOrFail({txnAddress: txnAddress})
    }

    static async txnGametoPlayer(
        player:User, 
        amount:number, 
        reason:string) {
        
        const gameAccount = process.env.OWNER_ACCOUNT;
        const sender = gameAccount;
        const recevier = player.publicAddress;
        const txCount = await web3.eth.getTransactionCount(gameAccount)
        const txnValues = {
            sender: sender,
            recevier: recevier,
            reason: reason,
            amount: amount,
        }

        BlockChainTransaction.findOne({
            where:{
                ...txnValues,
                status: In(["inflight", "success"])
            }
        }).then(async (txn:BlockChainTransaction|undefined)=>{
            if(txn==undefined){
                return await BlockChainTransaction.create({
                    ...txnValues,
                    status: "inflight",
                    nonce: txCount+1
                }).save();
            }else{
                return txn;
            }
        }).then(async (txn)=>await txn.blockchainTxn());
        return;
    }

    blockchainTxn = async () =>{
        if(this.status != "pending"){
            throw new Error(`status should be pending not ${this.status}.`);
        }
        const player = this.recevier;
        const masterAccount = process.env.OWNER_ACCOUNT;
        web3.eth.defaultAccount = masterAccount;

        console.log(">>>>", process.env.GAME_PRIVATE_KEY);
    
        const gamePrivateKey = Buffer.from(process.env.GAME_PRIVATE_KEY as string, 'hex');
    
        const abi = FutureToken.abi;
        const contractAddress = process.env.FUTURE_TOKEN_ADDRESS;
        const futureContract = new web3.eth.Contract(abi, contractAddress);
        const txnData = futureContract.methods.txnGameToPlayer(player, this.amount).encodeABI();
    
        // Build the transaction
        const txObject = {
            nonce:    web3.utils.toHex(this.nonce),
            to:       contractAddress,
            value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
            gasLimit: web3.utils.toHex(2100000),
            gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
            data:     txnData  
        }
        // Sign the transaction
        const tx = new Tx(txObject);
        tx.sign(gamePrivateKey);
        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex');
    
        // Broadcast the transaction
        return await web3.eth.sendSignedTransaction(raw);
    }

    static async getOneMaximumBlockNumber() {
        try{
            const query = this.createQueryBuilder()
            query.select("MAX(\"blockNumber\")", "maxBlockNumber")
            return query.getRawOne();
        } catch (QueryFailedError) {
            return {maxBlockNumber: 0}
        }
    }
    
}

@Entity('land_transfer')
export class LandTransfer extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @Column('integer', {nullable: false, default:0 })
    public nonce!: number;

    @Column('varchar', {nullable: false })
    public recevier!: string;

    @Column('varchar', {nullable: false })
    public sender!: string;

    @Column('varchar', {nullable: false })
    public tokenId!: string;

    @Column('integer', {nullable: false, default:0 })
    public blockNumber: number=0;

    @Column('boolean', {nullable: false, default:false })
    public isTransferEventRecored: boolean=false;

    @Column('varchar', {nullable: false, unique:true })
    public txnAddress!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static async getOneMaximumBlockNumber() {
        try{
            const query = this.createQueryBuilder()
            query.select("MAX(\"blockNumber\")", "maxBlockNumber")
            return query.getRawOne();
        } catch (QueryFailedError) {
            return {maxBlockNumber: 0}
        }
    }
}

@Entity('land_ownership')
@Unique(['user','landX','landY', 'tokenId'])
export class LandOwnership extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @Column('varchar', {nullable: false, unique:true })
    public landX!: string;

    @Column('varchar', {nullable: false, unique:true })
    public landY!: string;

    @Column('varchar', {nullable: false, unique:true })
    public tokenId!: string;

    @ManyToOne( type => User , user => user.id)
    public user!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static recordLandTransfer = async (txn:LandTransfer) => {
        await getManager().transaction(async transactionalEntityManager => {
            await transactionalEntityManager.save(txn)
            const user = await transactionalEntityManager.findOneOrFail(User, {publicAddress: txn.recevier})

            let landRecord = await transactionalEntityManager.findOne(LandOwnership, {tokenId: txn.tokenId});
            if(landRecord == undefined){
                landRecord = transactionalEntityManager.create(LandOwnership, {
                    tokenId:txn.tokenId
                })
            }

            const [x,y] = LandOwnership.getCoordinatesFromTokenId(txn.tokenId)

            landRecord.landX = x
            landRecord.landY = y
            landRecord.user = user
            await transactionalEntityManager.save(landRecord)
        });
    }

    //TODO
    static getCoordinatesFromTokenId(tokenId: String) {
        // const result = ["x","y"]
        return ["1","1"]
    }

    //TODO
    static getTokenIdFromCoordinates(x: string, y: string): string {
        return "340282366920938463463374607431768211457"
    }

}

@Entity('transfer_to_land_record')
export class TransferToLandRecord extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @Column('varchar', {nullable: false })
    public recevier!: string;

    @Column('varchar', {nullable: false })
    public sender!: string;

    @Column('varchar', {nullable: false })
    public ref!: string;

    @Column('integer', {nullable: false, default:0 })
    public blockNumber: number=0;

    @Column('varchar', {nullable: false, unique:true })
    public txnAddress!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static recordPayout = async (txn:TransferToLandRecord) => {
        await getManager().transaction(async transactionalEntityManager => {
            await transactionalEntityManager.save(txn)

            const feeTransaction = await transactionalEntityManager.findOne(FeeTransaction, {id: Number(txn.ref) })
            if(feeTransaction){
                feeTransaction.isRecored = true
                feeTransaction.recordHash = txn.txnAddress
                feeTransaction.status = 'success'
                await  transactionalEntityManager.save(feeTransaction)
            }
        });
    }

    static async getOneMaximumBlockNumber() {
        try{
            const query = this.createQueryBuilder()
            query.select("MAX(\"blockNumber\")", "maxBlockNumber")
            return query.getRawOne();
        } catch (QueryFailedError) {
            return {maxBlockNumber: 0}
        }
    }

}

export enum TransactionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
	INVALID = "invalid"
}

@Entity()
export class TokenLedger extends BaseEntity {
    @PrimaryGeneratedColumn()
	public id!: number; // Note that the `null assertion` `!` is required in strict mode.

    @Column('integer', {nullable: false })
    public userId!: number;

    @Column('float', {nullable: false })
    public count!: number;

    @Column({ 
		type: "enum",
        enum: TransactionStatus,
        default: TransactionStatus.PENDING
	})
	status?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    static async getTokensSumForUser(userId:number) {
        let tokens:TokenLedger[] = await TokenLedger.find({userId: userId});
        let count = 0.0;
        for (var token of tokens) {
            count += token.count;
        }
        return count;
    }

    static async rewardUser(userId:number, count: number) {
        const reward = TokenLedger.create({
            userId: userId,
            count: count
        })
        reward.save()
    }

}

