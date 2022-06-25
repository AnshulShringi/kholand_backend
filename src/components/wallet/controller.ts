import { NextFunction, Request, Response } from 'express';
import { TransactionStatus } from '../transactions/model';
import { User } from '../users/model';
import { Wallet, WithdrawlWallet } from './model';

export const get = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = req.user.payload.user;

    Wallet.getOrCreate(user).then(async (wallet) => {
        const withdrwalWalletProcessingBalance = await WithdrawlWallet.find({user: user, status: TransactionStatus.PROCESSING})
        let balance = 0
        withdrwalWalletProcessingBalance.forEach((withdrawal) => {
            balance = balance + withdrawal.amount
        })
        return res.status(200).send({
            walletBalance: wallet.balance,
            inProcessBalance: balance
        });
    }).catch(err => {
        return res.status(404).send(err);
    });
};

export const withdraw = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = req.user.payload.user;

    WithdrawlWallet.withdrawAllAmount(user).then(() => {
        return res.status(200).send({
            success: true,
            message: "success"
        });
    })
    .catch((err) => {
        return res.status(404).send({
            success: false,
            message: err.toString()
        });
    })
};
