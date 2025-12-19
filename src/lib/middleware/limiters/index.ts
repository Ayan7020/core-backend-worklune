import { Request, Response, NextFunction } from "express";
import { globalLimiter } from "./globalLimiter";
import { userLimiter } from "./userLimiter";
import { anomLimiter } from "./anomLimiter";
import { asyncHandler } from "@/utils/asyncHandler";
import { TooManyRequestError } from "@/utils/errors/HttpErrors";
import { AppError } from "@/utils/errors/AppError";

export const RateLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const ip = req.ip;
        if (userId) {
            await userLimiter.consume(userId, 1);
        } else {
            if (!ip) {
                throw new Error("Invalid Request!");
            }
            await anomLimiter.consume(ip, 1);
        }
        await globalLimiter.removeTokens(1);

        next();
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        if (error?.msBeforeNext !== undefined) { 
            throw new TooManyRequestError("Too many requests. Try again later.");
        }
        throw new Error;
    }
})