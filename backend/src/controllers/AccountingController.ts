// @ts-nocheck
import type { Request, Response } from 'express';
import { success, fail } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as AccountingCalcService from '../services/AccountingCalcService.js';
import * as PeriodLockService from '../services/PeriodLockService.js';
import * as AuditService from '../services/AuditService.js';
import * as AccountingExportService from '../services/AccountingExportService.js';

function canRead(req: Request) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'accountant');
}
function canWrite(req: Request) {
  return req.user && req.user.role === 'admin';
}

export async function summary(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getSummary(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve accounting summary');
  }
}

export async function costPerCar(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getCostPerCar(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve cost per car');
  }
}

export async function collectionPerCar(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getCollectionPerCar(
      req.query as Record<string, unknown>
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve collection per car');
  }
}

export async function carProfit(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getCarProfit(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve car profit');
  }
}

export async function customerLedger(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getCustomerLedger(
      req.query as Record<string, unknown>
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve customer ledger');
  }
}

export async function inventoryValuation(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getInventoryValuation();
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve inventory valuation');
  }
}

export async function cashBook(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getCashBook(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve cash book');
  }
}

export async function receivableAging(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.getReceivableAging(
      req.query as Record<string, unknown>
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve receivable aging');
  }
}

export async function setLcAllocations(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingCalcService.setLcAllocations(
      req.params.purchaseHistoryId,
      req.body
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update LC allocations');
  }
}

export async function listPeriods(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await PeriodLockService.listPeriods();
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to list accounting periods');
  }
}

export async function lockPeriod(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await PeriodLockService.lockPeriod(req.body, req.user);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to lock period');
  }
}

export async function unlockPeriod(req: Request, res: Response) {
  try {
    if (!canWrite(req)) return fail(res, 'Forbidden', 403);
    const result = await PeriodLockService.unlockPeriod(
      req.params.yearMonth,
      req.user,
      req.body
    );
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to unlock period');
  }
}

export async function auditLogs(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AuditService.listAuditLogs(req.query as Record<string, unknown>);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve audit logs');
  }
}

export async function exportExcel(req: Request, res: Response) {
  try {
    if (!canRead(req)) return fail(res, 'Forbidden', 403);
    const result = await AccountingExportService.buildExportWorkbook(
      req.query as Record<string, unknown>
    );
    res.setHeader('Content-Type', result.mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`
    );
    return res.status(200).send(result.buffer);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to export accounting workbook');
  }
}

export default {
  summary,
  costPerCar,
  collectionPerCar,
  carProfit,
  customerLedger,
  inventoryValuation,
  cashBook,
  receivableAging,
  setLcAllocations,
  listPeriods,
  lockPeriod,
  unlockPeriod,
  auditLogs,
  exportExcel,
};
