import { Request, Response, NextFunction } from "express";
import { globalLimiter } from "./globalLimiter";
import { userLimiter } from "./userLimiter";
import { anomLimiter } from "./anomLimiter";
import { asyncHandler } from "@/utils/asyncHandler";
import { TooManyRequestError } from "@/utils/errors/HttpErrors";
import { AppError } from "@/utils/errors/AppError";
import { verifyAccessToken } from "@/utils/jwtHelper";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const RateLimit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  if (!ip) {
    throw new Error("Invalid Request!");
  }
  try {
    const access_token = req.cookies?.access_token;
    if (access_token) {
      try {
        const payload = verifyAccessToken(access_token);
        const userId = String(payload.sub);
        await userLimiter.consume(userId, 1);
      } catch (err) { 
        await anomLimiter.consume(ip, 1);
      }
    } else {
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
    throw new Error();
  }
});
