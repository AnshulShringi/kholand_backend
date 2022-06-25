import express from 'express';
import jwt from 'express-jwt';

import { config } from '../../config';
import * as controller from './controller';

export const userPublicRouter = express.Router();
userPublicRouter.route('/accesstoken').post(controller.createAccessToken);
userPublicRouter.route('/nonce/:publicAddress').get(controller.getNonce);

/** GET /api/users/verify */
userPublicRouter.route('/verify').get(controller.verify);
userPublicRouter.route('/send-confirmation-mail/:userId').post(controller.sendConfirmationMail);
userPublicRouter.route('/unverify/:userId').post(controller.unVerify);

export const userRouter = express.Router();

/** /api/users/referral */
userRouter.route('/referral').get(controller.getReferralStatus)
userRouter.route('/referral').post(controller.addReferralCode)

/** GET /api/users/:userId */
userRouter.route('/me').get(controller.getMe);
userRouter.route('/me').patch(controller.updateMe);
userRouter.route('/:userId').get(controller.get);

/** PATCH /api/users/:userId */
userRouter.route('/:userId').patch(controller.patch);
