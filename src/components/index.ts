import express from 'express';
import jwt from 'express-jwt';
import { config } from '../config';

import { userPublicRouter, userRouter } from './users/index';
import { walletRouter } from './wallet';
import { txnRouter } from './transactions';
import { abiRouter } from './abi';
import { upVotePublicRouter } from './upvote';
import { pingPublicRouter } from './ping';
import { passRouter } from './passes/routes';
import { ledgerRouter } from './ledger/routes';
import { customHttpAuth } from './middlewares';


const publicServices = express.Router();
publicServices.use('/auth', userPublicRouter);
publicServices.use('/abi', abiRouter);
publicServices.use('/upvote', upVotePublicRouter);
publicServices.use('/ping', pingPublicRouter);

const authServices = express.Router();
authServices.use(customHttpAuth)
authServices.use('/users', userRouter);
authServices.use('/wallet', walletRouter);
authServices.use('/txn', txnRouter);
authServices.use('/pass', passRouter);
authServices.use('/ledger', ledgerRouter);

const services = express.Router();
services.use(publicServices)
services.use(authServices)

export { services }