import express from 'express';

import * as controller from './controller';

export const txnRouter = express.Router();
txnRouter.route('/player/game-ticket').get(controller.checkConsumableBalance);
txnRouter.route('/player/use-gameticket').post(controller.useGameTicket);
txnRouter.route('/player/pending-tokens').get(controller.getPendingTokenAmountForUser);

txnRouter.route('/').get(controller.getTransactionsForUser);