import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as PaymentHistoryService from '../services/PaymentHistoryService.js';

function resolvePaymentHistoryId(req) {
  return req.params.id || req.params.payment_history;
}

export async function index(req, res) {
  try {
    const result = await PaymentHistoryService.listPaymentHistories(req.query);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve payment histories');
  }
}

export async function store(req, res) {
  try {
    const result = await PaymentHistoryService.createPaymentHistory(req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create payment history');
  }
}

export async function show(req, res) {
  try {
    const result = await PaymentHistoryService.getPaymentHistory(resolvePaymentHistoryId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve payment history');
  }
}

export async function update(req, res) {
  try {
    const result = await PaymentHistoryService.updatePaymentHistory(
      resolvePaymentHistoryId(req),
      req.body
    );
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update payment history');
  }
}

export async function destroy(req, res) {
  try {
    const result = await PaymentHistoryService.deletePaymentHistory(resolvePaymentHistoryId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete payment history');
  }
}

export default {
  index,
  store,
  show,
  update,
  destroy,
};
