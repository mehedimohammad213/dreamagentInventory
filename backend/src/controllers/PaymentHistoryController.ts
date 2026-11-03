// @ts-nocheck
import type { Request, Response } from 'express';
import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as PaymentHistoryService from '../services/PaymentHistoryService.js';

function resolvePaymentHistoryId(req: Request): string | undefined {
  return (req.params.id || req.params.payment_history) as string | undefined;
}

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await PaymentHistoryService.listPaymentHistories(req.query as Record<string, unknown>);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve payment histories');
  }
}

function auditMeta(req: Request) {
  return {
    userId: req.user?.id,
    ip: req.ip || req.socket?.remoteAddress || null,
  };
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await PaymentHistoryService.createPaymentHistory(req.body, auditMeta(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create payment history');
  }
}

export async function show(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await PaymentHistoryService.getPaymentHistory(resolvePaymentHistoryId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve payment history');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await PaymentHistoryService.updatePaymentHistory(
      resolvePaymentHistoryId(req),
      req.body,
      auditMeta(req)
    );
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update payment history');
  }
}

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await PaymentHistoryService.deletePaymentHistory(
      resolvePaymentHistoryId(req),
      auditMeta(req)
    );
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
