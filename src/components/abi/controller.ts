import { NextFunction, Request, Response } from 'express';

import ContextAbi from './../../artifacts/abis/Context.json';
import ERC20Abi from './../../artifacts/abis/ERC20.json';
import FutureTokenAbi from './../../artifacts/abis/FutureToken.json';
import MigrationsAbi from './../../artifacts/abis/Migrations.json';

export const getABI = (req: Request, res: Response, next: NextFunction) => {
    const abiName = req.params && req.params.abiName || ""
    switch(abiName.toLowerCase()){
        case "context": return res.json(ContextAbi);
        case "erc20": return res.json(ERC20Abi);
        case "futuretoken": return res.json(FutureTokenAbi);
        case "migrations": return res.json(MigrationsAbi);
        default:
            return res.status(400).json({
                "error": "Only valid ABIs are [context, erc20, futureToken, migrations]"
            })
    }
}
