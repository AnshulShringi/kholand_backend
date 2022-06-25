import { NextFunction, Request, Response } from 'express';

export const pingPong = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200)
        .json({ pong: true });
};