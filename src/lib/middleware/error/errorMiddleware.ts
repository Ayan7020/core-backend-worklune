import { AppError } from "@/utils/errors/AppError";
import { InternalServerError } from "@/utils/errors/HttpErrors";
import { NextFunction, Request, Response } from "express"


const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;
    const isProduction = false;
    if (!(err instanceof AppError)) {
        error = new InternalServerError();
        if (!isProduction) {
            console.error("UNHANDLED ERROR:", err);
        }
    }
    const appError = error as AppError;
    if (!isProduction) {
        console.error({
            message: appError.message,
            code: appError.code,
            stack: appError.stack,
            details: appError.details,
        });
    }
    res.status(appError.statusCode).json({
        success: false,
        error: {
            code: appError.code,
            message: appError.message,
            ...(appError.details && { details: appError.details }),
        },
    }); 
    next();
}

export default errorHandler;