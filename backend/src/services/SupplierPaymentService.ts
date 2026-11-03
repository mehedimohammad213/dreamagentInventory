// @ts-nocheck
import SupplierPayment from '../models/SupplierPayment.js';
import BankAccount from '../models/BankAccount.js';
import PurchaseHistory from '../models/PurchaseHistory.js';
import Car from '../models/Car.js';
import { withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import {
  upsertSourceTransaction,
  deleteSourceTransaction,
} from './BankAccountService.js';
import { assertPeriodOpen } from './PeriodLockService.js';
import { writeAudit } from './AuditService.js';

export const SUPPLIER_PAYMENT_CATEGORIES = [
  'purchase_amount',
  'govt_duty',
  'cnf',
  'miscellaneous',
  'freight',
  'lc_margin',
  'other',
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

async function assertAccount(accountId) {
  const account = await BankAccount.find(toInt(accountId));
  if (!account || !account.is_active) {
    throw new ValidationError(
      { bank_account_id: ['The selected bank account is invalid or inactive.'] },
      'Validation error'
    );
  }
  return account;
}

function pickData(body) {
  return {
    payment_date: body.payment_date || new Date().toISOString().slice(0, 10),
    category: body.category || 'other',
    amount: toFloat(body.amount, 0),
    description: body.description ?? null,
    supplier_name: body.supplier_name ?? null,
    purchase_history_id:
      body.purchase_history_id === '' || body.purchase_history_id == null
        ? null
        : toInt(body.purchase_history_id),
    car_id:
      body.car_id === '' || body.car_id == null ? null : toInt(body.car_id),
    bank_account_id: toInt(body.bank_account_id),
    payment_method: body.payment_method ?? null,
    reference: body.reference ?? null,
  };
}

export async function listSupplierPayments(filters = {}) {
  let qb = SupplierPayment.query();

  if (isFilled(filters.category)) qb = qb.where('category', filters.category);
  if (isFilled(filters.bank_account_id)) {
    qb = qb.where('bank_account_id', toInt(filters.bank_account_id));
  }
  if (isFilled(filters.purchase_history_id)) {
    qb = qb.where('purchase_history_id', toInt(filters.purchase_history_id));
  }
  if (isFilled(filters.car_id)) qb = qb.where('car_id', toInt(filters.car_id));
  if (isFilled(filters.from)) qb = qb.where('payment_date', '>=', filters.from);
  if (isFilled(filters.to)) qb = qb.where('payment_date', '<=', filters.to);
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('description', term)
        .orWhere('supplier_name', 'ILIKE', term)
        .orWhere('reference', 'ILIKE', term);
    });
  }

  qb = qb.orderBy('payment_date', 'DESC').orderBy('id', 'DESC');
  const perPage = toInt(filters.per_page, 20);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const payments = SupplierPayment.hydrateMany(rows);
  for (const payment of payments) {
    await payment.loadRelations();
  }

  return {
    message: 'Supplier payments retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: payments,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
      categories: SUPPLIER_PAYMENT_CATEGORIES,
    },
  };
}

export async function createSupplierPayment(body, meta = {}) {
  const { ok, errors } = validate(body || {}, {
    payment_date: 'nullable|string',
    category: `nullable|string|in:${SUPPLIER_PAYMENT_CATEGORIES.join(',')}`,
    amount: 'required|numeric|min:0',
    description: 'nullable|string',
    supplier_name: 'nullable|string|max:255',
    purchase_history_id: 'nullable|numeric',
    car_id: 'nullable|numeric',
    bank_account_id: 'required|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
    reference: 'nullable|string|max:255',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  await assertAccount(body.bank_account_id);
  if (body.purchase_history_id) {
    const ph = await PurchaseHistory.find(toInt(body.purchase_history_id));
    if (!ph) {
      throw new ValidationError(
        { purchase_history_id: ['The selected purchase history is invalid.'] },
        'Validation error'
      );
    }
  }
  if (body.car_id) {
    const car = await Car.find(toInt(body.car_id));
    if (!car) {
      throw new ValidationError(
        { car_id: ['The selected car is invalid.'] },
        'Validation error'
      );
    }
  }

  const data = pickData(body);
  await assertPeriodOpen(data.payment_date, 'payment_date');
  const payment = await withTransaction(async (client) => {
    const created = await SupplierPayment.create(data, client);
    await upsertSourceTransaction(
      {
        bank_account_id: created.bank_account_id,
        txn_date: created.payment_date,
        type: 'out',
        amount: created.amount,
        reference: created.reference || `Supplier payment #${created.id}`,
        notes: created.description || created.supplier_name,
        source_type: 'supplier_payment',
        source_id: created.id,
      },
      client
    );
    return created;
  });

  await payment.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'create',
    entityType: 'supplier_payment',
    entityId: payment.id,
    summary: `Created supplier payment #${payment.id}`,
    after: payment.toJSON(),
    ip: meta.ip,
  });
  return {
    status: 201,
    message: 'Supplier payment created successfully',
    data: payment,
  };
}

export async function getSupplierPayment(id) {
  const payment = await SupplierPayment.find(id);
  if (!payment) throw new NotFoundError('Supplier payment not found');
  await payment.loadRelations();
  return {
    message: 'Supplier payment retrieved successfully',
    data: payment,
  };
}

export async function updateSupplierPayment(id, body, meta = {}) {
  const payment = await SupplierPayment.find(id);
  if (!payment) throw new NotFoundError('Supplier payment not found');

  const { ok, errors } = validate(body || {}, {
    payment_date: 'nullable|string',
    category: `nullable|string|in:${SUPPLIER_PAYMENT_CATEGORIES.join(',')}`,
    amount: 'nullable|numeric|min:0',
    description: 'nullable|string',
    supplier_name: 'nullable|string|max:255',
    purchase_history_id: 'nullable|numeric',
    car_id: 'nullable|numeric',
    bank_account_id: 'nullable|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
    reference: 'nullable|string|max:255',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  if (body.bank_account_id !== undefined) await assertAccount(body.bank_account_id);
  await assertPeriodOpen(payment.payment_date, 'payment_date');
  if (body.payment_date) await assertPeriodOpen(body.payment_date, 'payment_date');

  const data = {};
  for (const key of [
    'payment_date',
    'category',
    'description',
    'supplier_name',
    'payment_method',
    'reference',
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.amount !== undefined) data.amount = toFloat(body.amount, payment.amount);
  if (body.bank_account_id !== undefined) data.bank_account_id = toInt(body.bank_account_id);
  if (body.purchase_history_id !== undefined) {
    data.purchase_history_id =
      body.purchase_history_id === '' || body.purchase_history_id == null
        ? null
        : toInt(body.purchase_history_id);
  }
  if (body.car_id !== undefined) {
    data.car_id = body.car_id === '' || body.car_id == null ? null : toInt(body.car_id);
  }

  const before = payment.toJSON();
  await withTransaction(async (client) => {
    await payment.update(data, client);
    const fresh = await SupplierPayment.find(payment.id, client);
    await upsertSourceTransaction(
      {
        bank_account_id: fresh.bank_account_id,
        txn_date: fresh.payment_date,
        type: 'out',
        amount: fresh.amount,
        reference: fresh.reference || `Supplier payment #${fresh.id}`,
        notes: fresh.description || fresh.supplier_name,
        source_type: 'supplier_payment',
        source_id: fresh.id,
      },
      client
    );
  });

  const updated = await SupplierPayment.find(payment.id);
  await updated.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'update',
    entityType: 'supplier_payment',
    entityId: updated.id,
    summary: `Updated supplier payment #${updated.id}`,
    before,
    after: updated.toJSON(),
    ip: meta.ip,
  });
  return {
    message: 'Supplier payment updated successfully',
    data: updated,
  };
}

export async function deleteSupplierPayment(id, meta = {}) {
  const payment = await SupplierPayment.find(id);
  if (!payment) throw new NotFoundError('Supplier payment not found');
  await assertPeriodOpen(payment.payment_date, 'payment_date');
  const before = payment.toJSON();

  await withTransaction(async (client) => {
    await deleteSourceTransaction('supplier_payment', payment.id, client);
    await payment.delete(client);
  });

  await writeAudit({
    userId: meta.userId,
    action: 'delete',
    entityType: 'supplier_payment',
    entityId: id,
    summary: `Deleted supplier payment #${id}`,
    before,
    ip: meta.ip,
  });

  return {
    message: 'Supplier payment deleted successfully',
    data: null,
  };
}

export default {
  listSupplierPayments,
  createSupplierPayment,
  getSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  SUPPLIER_PAYMENT_CATEGORIES,
};
