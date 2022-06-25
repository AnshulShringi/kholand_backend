import express from 'express';
import jwt from 'express-jwt';

import { config } from '../../config';
import * as controller from './controller';

export const upVotePublicRouter = express.Router();
upVotePublicRouter.route('').get(controller.upVote);