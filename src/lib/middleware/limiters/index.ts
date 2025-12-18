import { Request, Response, NextFunction } from "express";
import { globalLimiter } from "./globalLimiter";
import { userLimiter } from "./userLimiter";
import { anomLimiter } from "./anomLimiter";

export const RateLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const ip = req.ip;
        if (userId) {
            await userLimiter.consume(userId, 1);
        } else { 
            if(!ip) {
                throw new Error("Invalid Request!");
            }
            await anomLimiter.consume(ip, 1);
        } 
        await globalLimiter.removeTokens(1);

        next();
    } catch (error) {
        res.status(429).json({
            error: "Too many requests",
        });
    }
}