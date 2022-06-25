import { NextFunction, Request, Response } from 'express';
import {FutureError} from '../exceptions/FutureError';
import { Pass, PassType } from './model';

export const getBattery = async (req: Request, res: Response, next: NextFunction) => {
    // AccessToken payload is in req.user.payload, especially its `id` field
	const userId = (req as any).user.payload.id;
	const pass: Pass|undefined = await Pass.getForUser(userId, PassType.BATTERY);
	if (pass == undefined) {
		res.json({ validationError: "No battery passes found for user" });
	}
	else {
		res.json(pass);
	}
	return res;
};

export const renewOrBuyBattery = async (req: Request, res: Response, next: NextFunction) => {
    // AccessToken payload is in req.user.payload, especially its `id` field
	const userId = (req as any).user.payload.id;
	let pass: Pass|undefined;
	try {
		pass = await Pass.renewOrCreateBattery(userId);
		if (pass == undefined) {
			res.status(500).json({ error: "Unable to renew battery for user" });
		}
		else {
			res.status(200).json(pass);
		}
	}
	catch (err) {
		if (err instanceof FutureError) {
			res.status(500).json({validationError: err.message});
		}
		else {
			throw err;
		}
	}
	return res;
};