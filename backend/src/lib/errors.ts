import type { Response } from 'express';

/**
 * Domain/service errors mapped to HTTP responses by controllers.
 */
export class AppError extends Error {
  status: number;
  extra: Record<string, unknown>;

  constructor(message: string, status = 400, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.extra = extra;
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422, { errors });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthenticated.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

interface ErrorWithStatus {
  status?: number;
  message: string;
  extra?: Record<string, unknown>;
}

/**
 * Map service errors into Express JSON responses.
 */
export function handleControllerError(
  res: Response,
  err: unknown,
  fallbackMessage = 'Request failed'
): Response {
  const error = err as ErrorWithStatus;
  if (err instanceof AppError || error?.status) {
    const status = error.status || 400;
    const body: Record<string, unknown> = {
      success: false,
      message: error.message,
      ...(error.extra || {}),
    };
    if (error.extra?.errors && !body.errors) body.errors = error.extra.errors;
    return res.status(status).json(body);
  }

  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: message,
  });
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  handleControllerError,
};
