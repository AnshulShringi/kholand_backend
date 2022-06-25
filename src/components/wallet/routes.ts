import express from 'express';
import * as controller from './controller';

export const walletRouter = express.Router();

walletRouter.route('/').get(controller.get);
walletRouter.route('/withdraw').post(controller.withdraw)
