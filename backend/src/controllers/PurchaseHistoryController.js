import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as PurchaseHistoryService from '../services/PurchaseHistoryService.js';

function resolvePurchaseHistoryId(req) {
  return req.params.id || req.params.purchase_history;
}

export async function index(req, res) {
  try {
    const result = await PurchaseHistoryService.listPurchaseHistories(req.query);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve purchase histories');
  }
}

export async function store(req, res) {
  try {
    const result = await PurchaseHistoryService.createPurchaseHistory(req.body, req.files);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create purchase history');
  }
}

export async function show(req, res) {
  try {
    const result = await PurchaseHistoryService.getPurchaseHistory(resolvePurchaseHistoryId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve purchase history');
  }
}

export async function update(req, res) {
  try {
    const result = await PurchaseHistoryService.updatePurchaseHistory(
      resolvePurchaseHistoryId(req),
      req.body,
      req.files
    );
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update purchase history');
  }
}

export async function downloadPdf(req, res) {
  try {
    const result = await PurchaseHistoryService.downloadPdf(
      resolvePurchaseHistoryId(req),
      req.query.field
    );
    if (result.type === 'download') {
      if (result.contentType) {
        res.setHeader('Content-Type', result.contentType);
      }
      return res.download(result.path, result.filename);
    }
    if (result.type === 'redirect') {
      return res.redirect(result.url);
    }
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to download PDF');
  }
}

export async function destroy(req, res) {
  try {
    const result = await PurchaseHistoryService.deletePurchaseHistory(resolvePurchaseHistoryId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete purchase history');
  }
}

export default {
  index,
  store,
  show,
  update,
  destroy,
  downloadPdf,
};
