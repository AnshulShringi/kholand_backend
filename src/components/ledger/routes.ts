import express from 'express';
import * as controller from './controller';

export const ledgerRouter = express.Router();

ledgerRouter.route('/record').post(controller.record);
ledgerRouter.route('/list').get(controller.list);