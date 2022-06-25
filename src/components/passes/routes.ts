import express from 'express';
import * as controller from './controller';

export const passRouter = express.Router();

passRouter.route('/battery').get(controller.getBattery);
passRouter.route('/battery').post(controller.renewOrBuyBattery);