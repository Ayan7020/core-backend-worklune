import { PrismaDriverAdapterMeta } from "@/types/common";
import { AppError } from "@/utils/errors/AppError";
import { BadRequestError, ConflictError, InternalServerError } from "@/utils/errors/HttpErrors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"; 

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    let error = err;
    const isProduction = false;
    if (!(err instanceof AppError)) {
        if (err instanceof ZodError) {
            const validationError = err.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }));
            error = new BadRequestError("Bad Request", {
                validationError
            });
        } else if (err instanceof PrismaClientKnownRequestError) {
            const meta = err.meta as PrismaDriverAdapterMeta | undefined;
            const fields =
                meta?.driverAdapterError?.cause?.constraint?.fields ??
                ["unknown"];
            switch (err.code) {
                case 'P2002':
                    error = new ConflictError(
                        "Duplicate value violates unique constraint",
                        { fields }
                    );
                    break;
                case 'P2025':
                    error = new BadRequestError();
                    break;
                case "P2003":
                    error = new BadRequestError("Invalid foreign key reference",
                        { fields }
                    );
                    break;
                default:
                    error = new InternalServerError();
            }
        }
        else {
            error = new InternalServerError();
            if (!isProduction) {
                console.error("[UNHANDLED ERROR]:", err);
            }
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