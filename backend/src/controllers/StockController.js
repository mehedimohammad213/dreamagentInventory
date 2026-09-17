import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as StockService from '../services/StockService.js';

export async function index(req, res) {
  try {
    const result = await StockService.index(req.query);
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

export async function show(req, res) {
  try {
    const result = await StockService.show(req.params.stock || req.params.id);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve stock');
  }
}

export async function store(req, res) {
  try {
    const result = await StockService.store(req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create stock');
  }
}

export async function update(req, res) {
  try {
    const result = await StockService.update(req.params.stock || req.params.id, req.body);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update stock');
  }
}

export async function destroy(req, res) {
  try {
    const result = await StockService.destroy(req.params.stock || req.params.id);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete stock');
  }
}

export async function bulkUpdateStatus(req, res) {
  try {
    const result = await StockService.bulkUpdateStatus(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      updated_count: result.updatedCount,
    });
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update stock statuses');
  }
}

export async function statistics(_req, res) {
  try {
    const result = await StockService.statistics();
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve stock statistics');
  }
}

export async function getAvailableCars(_req, res) {
  try {
    const result = await StockService.getAvailableCars();
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
