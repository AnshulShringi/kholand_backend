import express from 'express';
import * as controller from './controller';

export const pingPublicRouter = express.Router();
pingPublicRouter.route('').get(controller.pingPong);