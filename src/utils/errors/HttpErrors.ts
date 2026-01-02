import { AppError } from "./AppError";
import { ERROR_CODES, ErrorCode } from "./errorCodes";

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: Record<string, unknown>) {
    super(message, 400, ERROR_CODES.BAD_REQUEST, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Unauthorized",
    code: ErrorCode = ERROR_CODES.UNAUTHORIZED,
    details?: Record<string, unknown>,
  ) {
    super(message, 401, code, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: Record<string, unknown>) {
    super(message, 409, ERROR_CODES.CONFLICT, true, details);
  }
}

export class TooManyRequestError extends AppError {
  constructor(message = "Too many Request!", details?: Record<string, unknown>) {
    super(message, 429, ERROR_CODES.TOO_MANY_REQUEST, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>) {
    super("Validation failed", 422, ERROR_CODES.VALIDATION_FAILED, true, details);
  }
}

export class ServiceUnavaialbleError extends AppError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      (message = "Service unaavailable please try again later!"),
      503,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      true,
      details,
    );
  }
}

export class InternalServerError extends AppError {
  constructor() {
    super("Internal server error", 500, ERROR_CODES.INTERNAL_ERROR, false);
  }
}
