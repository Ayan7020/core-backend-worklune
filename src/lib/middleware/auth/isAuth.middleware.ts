import { ERROR_CODES } from "@/utils/errors/errorCodes";
import { UnauthorizedError } from "@/utils/errors/HttpErrors";
import { verifyAccessToken } from "@/utils/jwtHelper";
import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const isAuthenticatedUserMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    throw new UnauthorizedError("Authentication required", ERROR_CODES.INVALID_TOKEN);
  }

  try {
    const payload = verifyAccessToken(accessToken);

    req.user = {
      id: String(payload.sub),
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedError(
        "Authentication required Access token expired",
        ERROR_CODES.TOKEN_EXPIRED,
      );
    }

    if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedError(
        "Authentication required Invalid access token",
        ERROR_CODES.INVALID_TOKEN,
      );
    }

    throw error;
  }
};
