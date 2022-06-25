import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { SocketType } from '../../socketInterface';

import { User } from '../users/model';
import { config } from '../../config';

interface tokenData {
    payload: {
        id: number,
        publicAddress: string,
        user: User
    },
    iat: number
}

declare global {
    namespace Express {
        interface Request {
            user: tokenData
        }
    }
}

export const customHttpAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1];
        var decoded: tokenData | any = jwt.verify(token, config.secret);
        var userObj: User | undefined = await User.findOne(decoded.payload.id)
        if (!userObj) {
            res.status(404).json({ error: "User not found" })
            return;
        }
        decoded.payload.user = userObj
        req.user = decoded
        next();
    }
    else {
        res.status(401).json({ error: "Unauthorized" })
        return;
    }
}

export const customSocketAuth = async (socket: SocketType, next: any) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        next(new Error("Unauthorized"));
    }
    else {
        var decoded: tokenData | any = jwt.verify(token, config.secret);
        var userObj: User | undefined = await User.findOne(decoded.payload.id);
        if (!userObj) {
            next(new Error("User not found"));
        }
        else {
            socket.data.user = userObj;
            next();
        }
    }
}
