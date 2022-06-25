import express from 'express';

import * as controller from './controller';

export const abiRouter = express.Router();

abiRouter.route('/:abiName').get(controller.getABI);
