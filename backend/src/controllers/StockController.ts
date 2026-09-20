// @ts-nocheck
import type { Request, Response } from 'express';
import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as StockService from '../services/StockService.js';

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.index(req.query as Record<string, unknown>);
    return res.status(result.status || 200).json({
      success: true,
      data: result.data,
      current_page: result.pagination.current_page,
      last_page: result.pagination.last_page,
      per_page: result.pagination.per_page,
      total: result.pagination.total,
      message: result.message,
    });
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve stocks');
  }
}

export async function show(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.show(req.params.stock || req.params.id);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve stock');
  }
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.store(req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create stock');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.update(req.params.stock || req.params.id, req.body);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update stock');
  }
}

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.destroy(req.params.stock || req.params.id);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete stock');
  }
}

export async function bulkUpdateStatus(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.bulkUpdateStatus(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      updated_count: result.updatedCount,
    });
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update stock statuses');
  }
}

export async function statistics(_req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.statistics();
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve stock statistics');
  }
}

export async function getAvailableCars(_req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await StockService.getAvailableCars();
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve available cars');
  }
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  bulkUpdateStatus,
  statistics,
  getAvailableCars,
};
