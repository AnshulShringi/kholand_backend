import { NextFunction, Request, Response } from 'express';

import { User } from './../users/model';
import { AmountPerPlayer, FeeTransaction, BlockChainTransaction, LandOwnership, TokenLedger } from './model';


export const checkConsumableBalance = async (req: Request, res: Response, next: NextFunction) => {
	const publicAddress = (req as any).user.payload.publicAddress;

	const user = await User.findOneOrFail({publicAddress: publicAddress})
	const amt = await AmountPerPlayer.findOneOrFail({user: user})

	return res.json(amt)
}

export const useGameTicket = async (req: Request, res: Response, next: NextFunction) => {
	const publicAddress = (req as any).user.payload.publicAddress;
	const landX = (req as any).body.x
	const landY = (req as any).body.y

	const user = await User.findOneOrFail({publicAddress: publicAddress})
	const amountPerPlayer = await AmountPerPlayer.findOneOrFail({user: user})
	const landTokenId = LandOwnership.getTokenIdFromCoordinates(landX, landY)

	if(amountPerPlayer.amount<100){
		return res.json({
			'success':false,
			'message':'Amount already less than game fee'
		})
	}

	const feeTransaction = await FeeTransaction.create({
		amountPerPlayer: amountPerPlayer,
		amount: 100,
		sender: publicAddress,
		landTokenId: landTokenId
	}).save()

	await AmountPerPlayer.recordFeeTxn(user, feeTransaction);

	return res.json({
		'success':true,
		'message':'Amount Used'
	})
}

export const getTransactionsForUser = async (req: Request, res: Response, next: NextFunction) => {
	const authUserId = (req as any).user.payload.id;
	const publicAddress = (req as any).user.payload.publicAddress;

	BlockChainTransaction.find({
		where:
			[
				{ sender: publicAddress },
				{ recevier: publicAddress},
			],
		order : {
			blockNumber: 'DESC'
		}

	})
		.then((transactions: BlockChainTransaction[]) => {
			res.json(transactions);
			return;
		})
		.catch((error:Error)=>{
			res.json({
				error:error.toString()
			});
			next(error);
		})
}

export const getPendingTokenAmountForUser = async (req: Request, res: Response, next: NextFunction) => {
	const authUserId = (req as any).user.payload.id;
	TokenLedger.getTokensSumForUser(authUserId).then(count => {
		res.json({userId: authUserId, count: count});
	}).catch((error:Error)=>{
		res.json({
			error:error.toString()
		});
		next(error);
	})
}