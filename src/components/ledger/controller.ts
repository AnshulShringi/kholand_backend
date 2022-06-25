import { NextFunction, Request, Response } from 'express';
import { Ledger, RecordType } from './model';

export const list = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.payload.id;
	const take:number = Number(req.query.take) || 10
    const skip:number = Number(req.query.skip) || 0
	const [result, total] = await Ledger.findAndCount({
			where: [{ userId: userId }],
			order: { createdAt: 'DESC' },
			take: take,
			skip: skip
		});

	return res.status(200).json({
        data: result,
        count: total
    });
};

export const record = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.payload.id;
	const amount:number = Number(req.query.amount);
    const type:string = req.query.type as string;
    const metadata:string = req.query.metadata as string;
	await Ledger.record(userId, amount, (<any>RecordType)[type], metadata).then(() => {
		return res.status(200).json({
			success: true
		});
	}).catch((err: Error) => {
		return res.status(500).json({
			error: err.toString()
		})
	});
}