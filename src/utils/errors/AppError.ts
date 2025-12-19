import { ErrorCode } from "./errorCodes";

export abstract class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly isOperational: boolean;
    public readonly details?: Record<string, unknown>;

    protected constructor(
        message: string,
        statusCode: number,
        code: ErrorCode,
        isOperational = true,
        details?: Record<string, unknown>
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this);
    }
}