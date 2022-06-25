import web3 from "./web3Read";
import KhoKhoLandToken from "../../artifacts/abis/KhoKhoLandToken.json";
import { EventData } from "web3-eth-contract/types";
import { User } from '../users/model';
import { BlockChainTransaction, AmountPerPlayer, LandTransfer, LandOwnership } from '../transactions/model';

export const token = new web3.eth.Contract(
  (KhoKhoLandToken as any).abi,
  process.env.LAND_TOKEN_ADDRESS
);

export const captureBlockChainTxnSingleItem = async(transaction: EventData) => {
  const sender = transaction.returnValues.from.toLowerCase()
  const receiver = transaction.returnValues.to.toLowerCase()
  const senderUser = await User.getOrCreate(sender)
  const receiverUser = await User.getOrCreate(receiver)
  const txn = LandTransfer.create({
    txnAddress: transaction.transactionHash,
    blockNumber: transaction.blockNumber,
    sender: sender,
    recevier: receiver,
    isTransferEventRecored: true,
    tokenId: transaction.returnValues.tokenId
  });

  await LandOwnership.recordLandTransfer(txn)
}

export const captureBlockChainLandTxnList = async() => {
	const maxBlockNumber = await LandTransfer.getOneMaximumBlockNumber()
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
