import web3 from "./web3Read";
import FutureToken from "../../artifacts/abis/FutureToken.json";
import { EventData } from "web3-eth-contract/types";
import { User } from '../users/model';
import {BlockChainTransaction, AmountPerPlayer, TransferToLandRecord} from '../transactions/model';
import {BigNumber} from "ethers";
import {Double} from "typeorm";

export const token = new web3.eth.Contract(
  (FutureToken as any).abi,
  process.env.FUTURE_TOKEN_ADDRESS
);

export const captureBlockChainTxnSingleItem = async(transaction: EventData) => {

  //TODO = Amount coming from 0 indicates deployment transaction; to be handled
  if(transaction.returnValues.from == '0x0000000000000000000000000000000000000000')
    return

    const amount = web3.utils.fromWei(transaction.returnValues.value)
    const amountInFloat = parseFloat(amount)
    const amountInNumber = Number(amountInFloat.toFixed(0))

  const blockChainTxn = BlockChainTransaction.create({
    txnAddress: transaction.transactionHash,
    blockNumber: transaction.blockNumber,
    status: 'success',
    sender: transaction.returnValues.from.toLowerCase(),
    recevier: transaction.returnValues.to.toLowerCase(),
    amount: amountInNumber
  });

  const player = await User.getOrCreate(blockChainTxn.sender)
  const receiver = await User.getOrCreate(blockChainTxn.recevier)
  console.log("Player", player)
  const savedblockChainTxn = await BlockChainTransaction.createIfNotPresent(transaction.transactionHash, blockChainTxn);
  if(process.env.OWNER_ACCOUNT === savedblockChainTxn.recevier){
    await AmountPerPlayer.recordBlockChainTxn(player, savedblockChainTxn)
  }
}

export const captureBlockChainTxnList = async() => {
	const maxBlockNumber = await BlockChainTransaction.getOneMaximumBlockNumber()
	const toSyncBlockNumber = (maxBlockNumber.maxBlockNumber || -1) + 1
	
	console.log("Fetching block events");
	token.getPastEvents('Transfer', {
		fromBlock: toSyncBlockNumber,
		toBlock: 'latest'
	}).then(async txnList => {
		console.log(`Found ${txnList.length} txns`)
		for (const txnIndex in txnList){
      try{
        const transaction = txnList[txnIndex]
        if(transaction.returnValues.from == '0x0000000000000000000000000000000000000000')
          continue
        console.log(`Start: ${transaction.address}`)
        await captureBlockChainTxnSingleItem(transaction);
        console.log(`End: ${transaction.address}`)
      } catch (err: any) {
        console.error(err);
      }
		} 
	})
	.catch(err => {
		console.log(err)
	})
}


export const captureTransferToDeveloperEvents = async() => {
    const maxBlockNumber = await TransferToLandRecord.getOneMaximumBlockNumber()
    const toSyncBlockNumber = (maxBlockNumber.maxBlockNumber || -1) + 1

    console.log("Fetching block events");
    token.getPastEvents('TransferToLandOwner', {
        fromBlock: toSyncBlockNumber,
        toBlock: 'latest'
    }).then(async txnList => {
        console.log(`Found ${txnList.length} txns`)
        for (const txnIndex in txnList){
            try{
                const transaction = txnList[txnIndex]
                console.log(`Start: ${transaction.address}`)
                await captureTransferToDeveloperEventsSingleItem(transaction);
                console.log(`End: ${transaction.address}`)
            } catch (err: any) {
                console.error(err);
            }
        }
    })
        .catch(err => {
            console.log(err)
        })
}

export const captureTransferToDeveloperEventsSingleItem = async(transaction: EventData) => {
    console.log(transaction)
    const payoutRef = transaction.returnValues.payoutRef
    console.log("Ref", payoutRef)

    const blockChainTxn = TransferToLandRecord.create({
        txnAddress: transaction.transactionHash,
        blockNumber: transaction.blockNumber,
        sender: transaction.returnValues.from.toLowerCase(),
        recevier: transaction.returnValues.to.toLowerCase(),
        ref: payoutRef,
    });

    await TransferToLandRecord.recordPayout(blockChainTxn)
}
