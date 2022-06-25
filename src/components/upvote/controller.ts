import { NextFunction, Request, Response } from 'express';
import { Upvote } from './model';

export const upVote = async (req: Request, res: Response, next: NextFunction) => {
	let gameIdentifier = req.query.game

	if(gameIdentifier){
		Upvote.registerUpvote(gameIdentifier.toString()).then(() => {
			return res.status(200)
				.json({ success: true });
		}).catch(next)

	}
	else{
		return res.status(404)
			.json({ success: false });
	}
};