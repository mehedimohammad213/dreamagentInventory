// @ts-nocheck
import type { Request, Response } from 'express';
import { success, fail } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as ExpenseService from '../services/ExpenseService.js';

function canRead(req: Request) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'accountant');
}
function canWrite(req: Request) {
  return req.user && req.user.role === 'admin';
}
function meta(req: Request) {
  return { userId: req.user?.id, ip: req.ip || req.socket?.remoteAddress || null };
}

export async function index(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await ExpenseService.listExpenses(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve expenses');
  }
}

export async function store(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await ExpenseService.createExpense(req.body, meta(req));
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create expense');
  }
}

export async function show(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await ExpenseService.getExpense(req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve expense');
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await ExpenseService.updateExpense(req.params.id, req.body, meta(req));
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update expense');
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await ExpenseService.deleteExpense(req.params.id, meta(req));
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete expense');
  }
}

export default { index, store, show, update, destroy };
