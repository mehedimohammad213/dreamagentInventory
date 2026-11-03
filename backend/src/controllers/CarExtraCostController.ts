// @ts-nocheck
import type { Request, Response } from 'express';
import { success, fail } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as CarExtraCostService from '../services/CarExtraCostService.js';

function canRead(req: Request) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'accountant');
}
function canWrite(req: Request) {
  return req.user && req.user.role === 'admin';
}

export async function index(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await CarExtraCostService.listExtraCosts(
      req.query as Record<string, unknown>
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve car extra costs');
  }
}

export async function store(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await CarExtraCostService.createExtraCost(req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create car extra cost');
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await CarExtraCostService.updateExtraCost(req.params.id, req.body);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car extra cost');
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await CarExtraCostService.deleteExtraCost(req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete car extra cost');
  }
}

export default { index, store, update, destroy };
