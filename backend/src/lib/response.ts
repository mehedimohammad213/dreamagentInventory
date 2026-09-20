import type { Response } from 'express';

export function success(
  res: Response,
  data: unknown = null,
  message: string | null = null,
  status = 200
): Response {
  const body: Record<string, unknown> = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
): Response {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  });
}

export function validationFail(res: Response, errors: Record<string, string[]>): Response {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

export function serverError(res: Response, message: string, error?: unknown): Response {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (error) {
    body.error = typeof error === 'string' ? error : (error as Error).message;
  }
  return res.status(500).json(body);
}

export default { success, fail, validationFail, serverError };
