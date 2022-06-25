import { NextFunction, Request, Response } from 'express';


export class SocialMediaRedirects {
    static discord = async (req: Request, res: Response, next: NextFunction) => {
        res.redirect("https://discord.gg/eD2rPkBKgH")
    }

    static telegram = async (req: Request, res: Response, next: NextFunction) => {
        res.redirect("https://t.me/kho_land")
    }
}

