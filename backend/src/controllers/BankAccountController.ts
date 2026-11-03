// @ts-nocheck
import type { Request, Response } from 'express';
import { success, fail } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as BankAccountService from '../services/BankAccountService.js';

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
    const result = await BankAccountService.listAccounts(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve bank accounts');
  }
}

export async function store(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.createAccount(req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create bank account');
  }
}

export async function show(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.getAccount(req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve bank account');
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.updateAccount(req.params.id, req.body);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update bank account');
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.deleteAccount(req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete bank account');
  }
}

export async function transactions(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.listTransactions(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve transactions');
  }
}

export async function storeTransaction(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.createManualTransaction(req.body, meta(req));
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create transaction');
  }
}

export async function transfer(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await BankAccountService.transfer(req.body, meta(req));
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to transfer');
  }
}

export default {
  index,
  store,
  show,
  update,
  destroy,
  transactions,
  storeTransaction,
  transfer,
};
