import { UnauthorizedError } from "@/utils/errors/HttpErrors";
import { verifyAccessToken } from "@/utils/jwtHelper";
import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const isAuthenticatedUserMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    throw new UnauthorizedError("Authentication required");
  }

  try {
    const payload = verifyAccessToken(accessToken);

    req.user = {
      id: String(payload.sub), 
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedError("Access token expired");
    }

    if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedError("Invalid access token");
    }

    throw error;
  }
};
