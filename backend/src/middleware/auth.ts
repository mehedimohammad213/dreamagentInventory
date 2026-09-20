import type { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { findToken } from '../lib/tokens.js';
import { fail } from '../lib/response.js';

/**
 * Bearer token auth (Sanctum-compatible).
 * Attaches req.user and req.accessToken
 */
export async function auth(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const header = req.headers.authorization || '';
    const found = await findToken(header);
    if (!found) {
      return fail(res, 'Unauthenticated.', 401);
    }

    const user = await User.find(found.userId);
    if (!user) {
      return fail(res, 'Unauthenticated.', 401);
    }

    req.user = user;
    req.accessToken = found.tokenRow;
    return next();
  } catch (err) {
    return fail(res, 'Authentication failed', 401, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization || '';
    if (!header) {
      next();
      return;
    }
    const found = await findToken(header);
    if (found) {
      req.user = await User.find(found.userId);
      req.accessToken = found.tokenRow;
    }
    next();
  } catch {
    next();
  }
}

export function admin(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 'Forbidden', 403);
  }
  return next();
}

export default { auth, optionalAuth, admin };
