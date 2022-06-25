import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';

import { Referral, User, VerificationCode } from './model';
import { config } from '../../config';
import {sendVerificationMail} from './emailUtils';
import { getRepository } from 'typeorm';

export  const getNonce = async (req: Request, res: Response, next: NextFunction) => {
	const publicAddress = req.params && req.params.publicAddress || undefined
	if(publicAddress){
		User
		.getOrCreate(publicAddress).then((user)=>{
			res.json({nonce:user.nonce});
		})
		.catch(next);
		return
	}

	res
	.status(404)
	.json({ error: 'Nonce can\'t be generated.' });

};

export const createAccessToken = (req: Request, res: Response, next: NextFunction) => {
	const { signature, publicAddress, phoneNumber, fcmToken} = req.body;
	if (!signature || !publicAddress)
		return res
			.status(400)
			.send({ error: 'Request should have signature and publicAddress' });

	User.findOne({publicAddress:publicAddress})
		.then((user: User | undefined) => {
			if (!user) {
				res.status(401).json({
					error: `User with publicAddress ${publicAddress} is not found in database`,
				});
				return;
			}
			if (phoneNumber) {
				user.phoneNumber = phoneNumber;
			}
			if(fcmToken) {
				user.fcmToken = fcmToken;
			}
			user.save();
			
			user.generateAccessToken(signature, req.headers['x-forwarded-for']?.toString()).then((accessToken:string) =>{
				res.json({ accessToken });
				return
			});
		})
		.catch(next)
	
};

export const get = (req: Request, res: Response, next: NextFunction) => {
	// AccessToken payload is in req.user.payload, especially its `id` field
	// UserId is the param in /users/:userId
	// We only allow user accessing herself, i.e. require payload.id==userId
	if ((req as any).user.payload.id !== +req.params.userId) {
		return res
			.status(401)
			.send({ error: 'You can can only access yourself' });
	}
	return User.findOne(req.params.userId)
		.then((user: User | undefined) => {
			if(user==undefined){
				res
				.status(404)
				.json({ error: 'Data not found.' });
			}else{
				res.json(user)
			}
		})
		.catch(next);
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
	const user: User = (req as any).user.payload.user;
	await getRepository(Referral).createQueryBuilder('referral')
		.innerJoin('referral.referrerUser', 'user', 'referral.referrerUserId = user.id')
		.where('referral.referredUserId = :referredUserId', { referredUserId: user.id })
		.select(['referral.id', 'user.id', 'user.publicAddress', 'user.nickname', 'user.referralCode'])
		.getOneOrFail()
		.then(referral => {
			return res.status(200).json({
				...user,
				isReferralCompleted: true,
				referral: referral,
			})
		}).catch((err) => {
			return res.status(200).json({
				...user,
				isReferralCompleted: false,
			})
		})
};

export const updateMe = (req: Request, res: Response, next: NextFunction) => {
	// AccessToken payload is in req.user.payload, especially its `id` field
	const myId = (req as any).user.payload.id;
	const body = (req as any).body

	return User.findOne(myId).then((user: User | undefined) => {
		if(user==undefined){
			return res.status(401).json({success: false, error:'User not found'})
		}else{
			user.characterId = body.characterId
			user.nickname = body.nickname
			user.fcmToken = body.fcmToken
			user.save().then((user: User)=>{
				return res.status(200).json(user);
			})
		}
	}).catch(next);
}

export const patch = (req: Request, res: Response, next: NextFunction) => {
	// Only allow to fetch current user
	if ((req as any).user.payload.id !== +req.params.userId) {
		return res
			.status(401)
			.send({ error: 'You can can only access yourself' });
	}
	return User.findOne(req.params.userId)
		.then((user: User | undefined) => {
			if(user==undefined){
				return user;
			}

			Object.assign(user, req.body);
			return user.save();
		})
		.then((user: User | undefined) => {
			return user
				? res.json(user)
				: res.status(401).json({
						error: `User with publicAddress ${req.params.userId} is not found in database`,
				  });
		})
		.catch(next);
};

interface emailVerificationData {
	userId: number,
    email: string,
	code: string
}

export const verify = (req: Request, res: Response, next: NextFunction) => {
	const token:string = req.query.token as string;
	const tokenDecoded: emailVerificationData | any = jwt.verify(token, config.secret);
	const resendMailLink = process.env.BASE_URL + "/send-confirmation-mail/" + tokenDecoded.userId;
	return User.findOne(tokenDecoded.userId)
		.then((user: User | undefined) => {
			if (user == undefined) {
				return res.json("Account does not exist. Please request for a confirmation mail from kholand app");
			}
			else if (user.verified) {
				return res.json("You are already verified!")
			}
			else {
				return VerificationCode.findOne({
						where: [ {userId:user.id, code:tokenDecoded.code}],
						order: { createdAt: 'DESC' }
					}).then((verificationCode: VerificationCode | undefined) => {
						if (verificationCode == undefined || verificationCode.code != tokenDecoded.code || verificationCode.expiryTimestamp < new Date() || user.email != tokenDecoded.email) {
							return res.json("Link is not valid anymore. Please click here to resend the verification email: " + resendMailLink);
						}
						else {
							user.verified = true;
							user.save();
							return res.json("You are now verified!");
						}
					});
			}
			
		})
		.catch(next);
};

export const sendConfirmationMail = (req: Request, res: Response, next: NextFunction) => {
	var email:string = req.query.email as string;
	return User.findOne(req.params.userId)
		.then((user: User | undefined) => {
			if (user == undefined) {
				return res
						.status(500)
						.json({ error: "Invalid link" });
			}
			else if (user.verified) {
				return res
						.status(500)
						.json({ error: "You are already verified" });
			}
			else {
				user.email = email;
				user.save();
				const verificationCode = VerificationCode.createObject(user.id, uuidv4());
				verificationCode.save();
				const token = jwt.sign({userId: user.id, email: user.email, code: verificationCode.code}, config.secret);
				const redirectEmail = process.env.BASE_URL + "/auth/verify?token=" + token;
				sendVerificationMail(user.email, redirectEmail);
				return res
						.status(200)
						.json({ json: redirectEmail });
			}
		})
		.catch(next);
};

export const getReferralStatus = async (req: Request, res: Response, next: NextFunction) => {
	const user: User = (req as any).user.payload.user

	await getRepository(Referral).createQueryBuilder('referral')
		.innerJoin('referral.referrerUser', 'user', 'referral.referrerUserId = user.id')
		.where('referral.referredUserId = :referredUserId', { referredUserId: user.id })
		.select(['referral.id', 'user.id', 'user.publicAddress', 'user.nickname', 'user.referralCode'])
		.getOneOrFail()
		.then(referral => {
			return res.status(200).json({
				...referral,
				isReferralCompleted: true,
			})
		}).catch((err) => {
			return res.status(200).json({
				isReferralCompleted: false
			})
		})
}

interface addReferralCodeBodyData {
	referralCode: string
}

export const addReferralCode = async (req: Request, res: Response, next: NextFunction) => {
	const referredUser: User = (req as any).user.payload.user

	// Check for referral code in request body
	const addReferralCodeBody: addReferralCodeBodyData = req.body;
	const referralCode = addReferralCodeBody.referralCode

	if (referralCode == null) {
		return res.status(400).json({ error: 'referralCode not provided' })
	}

	await Referral.addReferralCode(referredUser, referralCode).then(referral => {
		getRepository(Referral).createQueryBuilder('referral')
		.innerJoin('referral.referrerUser', 'user', 'referral.referrerUserId = user.id')
		.where('referral.id = :referralId', { referralId: referral.id })
		.select(['referral.id', 'user.id', 'user.publicAddress', 'user.nickname', 'user.referralCode'])
		.getOneOrFail()
		.then(referral => {
			return res.status(200).json(referral)
		}).catch((err) => {
			return res.status(400).json({
				error: 'referral code not entered yet'
			})
		})
	}).catch((err: Error) => {
		return res.status(400).json({
			error: err.toString()
		})
	})
}

// Temporary code to validate changes
export const unVerify = (req: Request, res: Response, next: NextFunction) => {
	return User.findOne(req.params.userId)
		.then((user: User | undefined) => {
			if (user == undefined) {
				return res.json("Invalid link");
			}
			else {
				user.verified = false;
				user.save();
				return res.json("You are unverified");
			}
		})
		.catch(next);
};
