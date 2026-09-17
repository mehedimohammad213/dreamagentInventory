/**
 * Domain/service errors mapped to HTTP responses by controllers.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {Record<string, any>} [extra] e.g. { errors: {...} }
   */
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.extra = extra;
  }
}

export class ValidationError extends AppError {
  /**
   * @param {Record<string, string[]>} errors
   * @param {string} [message]
   */
  constructor(errors, message = 'Validation failed') {
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

/**
 * Map service errors into Express JSON responses.
 */
export function handleControllerError(res, err, fallbackMessage = 'Request failed') {
  if (err instanceof AppError || err?.status) {
    const status = err.status || 400;
    const body = {
      success: false,
      message: err.message,
      ...(err.extra || {}),
    };
    if (err.extra?.errors && !body.errors) body.errors = err.extra.errors;
    return res.status(status).json(body);
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: err?.message || String(err),
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
