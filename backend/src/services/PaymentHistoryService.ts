// @ts-nocheck
import PaymentHistory from '../models/PaymentHistory.js';
import Installment from '../models/Installment.js';
import Car from '../models/Car.js';
import { withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import {
  resolveAccountForPaymentMethod,
  upsertSourceTransaction,
  deleteSourceTransaction,
  deleteSourceTransactions,
} from './BankAccountService.js';
import { assertPeriodOpen } from './PeriodLockService.js';
import { writeAudit } from './AuditService.js';

const PAYMENT_SCALAR_FIELDS = [
  'car_id', 'showroom_name', 'wholesaler_address', 'purchase_amount', 'purchase_date',
  'nid_number', 'customer_name', 'tin_certificate', 'customer_address',
  'contact_number', 'email',
];

const NUMERIC_FIELDS = new Set(['car_id', 'purchase_amount']);

const SORTABLE_COLUMNS = new Set([
  'id', 'created_at', 'updated_at', 'purchase_date', 'purchase_amount',
  'showroom_name', 'customer_name', 'contact_number',
]);

const INSTALLMENT_FIELDS = [
  'installment_date', 'description', 'amount', 'payment_method',
  'bank_name', 'cheque_number', 'balance', 'remarks', 'bank_account_id',
  'cheque_status',
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function pickPaymentData(source) {
  const out = {};
  for (const key of PAYMENT_SCALAR_FIELDS) {
    if (source[key] === undefined) continue;
    if (key === 'car_id') {
      out[key] = source[key] === '' ? null : toInt(source[key], null);
    } else if (NUMERIC_FIELDS.has(key)) {
      out[key] = toFloat(source[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

function pickInstallmentData(source) {
  const out = {};
  for (const key of INSTALLMENT_FIELDS) {
    if (source[key] === undefined) continue;
    if (key === 'amount' || key === 'balance') {
      out[key] = toFloat(source[key], source[key]);
    } else if (key === 'bank_account_id') {
      out[key] = source[key] === '' || source[key] == null ? null : toInt(source[key], null);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

async function syncInstallmentBankTransaction(installment, client = null) {
  if (!installment?.id) return;

  const amount = toFloat(installment.amount, 0);
  const chequeStatus = installment.cheque_status || null;

  // Bounced cheques should not stay as money in the account
  if (
    !amount ||
    amount <= 0 ||
    !installment.payment_method ||
    chequeStatus === 'bounced'
  ) {
    await deleteSourceTransaction('installment', installment.id, client);
    return;
  }

  const account = await resolveAccountForPaymentMethod(
    installment.payment_method,
    installment.bank_account_id,
    client
  );

  if (!account) {
    await deleteSourceTransaction('installment', installment.id, client);
    return;
  }

  if (installment.bank_account_id !== account.id) {
    await installment.update({ bank_account_id: account.id }, client);
    installment.bank_account_id = account.id;
  }

  await upsertSourceTransaction(
    {
      bank_account_id: account.id,
      txn_date: installment.installment_date || new Date().toISOString().slice(0, 10),
      type: 'in',
      amount,
      reference: installment.cheque_number || `Installment #${installment.id}`,
      notes: installment.description || installment.remarks || null,
      source_type: 'installment',
      source_id: installment.id,
    },
    client
  );
}

async function assertPaymentDatesOpen(paymentDate, installments = []) {
  if (paymentDate) await assertPeriodOpen(paymentDate, 'purchase_date');
  for (let i = 0; i < (installments || []).length; i += 1) {
    const d = installments[i]?.installment_date;
    if (d) await assertPeriodOpen(d, `installments.${i}.installment_date`);
  }
}

function recomputeInstallmentBalances(saleAmount, installments) {
  const sale = toFloat(saleAmount, 0) || 0;
  let running = 0;
  return (installments || []).map((item) => {
    const amount = toFloat(item?.amount, 0) || 0;
    running += amount;
    return {
      ...item,
      balance: Math.max(sale - running, 0),
    };
  });
}

function parseInstallments(body) {
  const parsed = { ...body };
  if (typeof parsed.installments === 'string') {
    try {
      parsed.installments = JSON.parse(parsed.installments);
    } catch {
      parsed.installments = null;
    }
  }
  return parsed;
}

async function validateCarId(carId) {
  if (carId == null || carId === '') return { ok: true, errors: {} };
  const car = await Car.find(toInt(carId));
  if (!car) {
    return { ok: false, errors: { car_id: ['The selected car id is invalid.'] } };
  }
  return { ok: true, errors: {} };
}

async function assertCarNotAlreadyPaid(carId, exceptPaymentId = null) {
  if (carId == null || carId === '') return;
  const id = toInt(carId);
  if (id == null) return;

  let qb = PaymentHistory.query().where('car_id', id);
  if (exceptPaymentId != null) {
    qb = qb.where('id', '!=', exceptPaymentId);
  }
  const existing = await qb.first();
  if (existing) {
    throw new ValidationError(
      { car_id: ['This chassis number is already available in the car list.'] },
      'This chassis number is already available in the car list.'
    );
  }
}

function validateInstallments(installments, { isUpdate = false } = {}) {
  if (installments == null) return { ok: true, errors: {} };

  if (!Array.isArray(installments)) {
    return { ok: false, errors: { installments: ['The installments must be an array.'] } };
  }

  const errors = {};

  installments.forEach((item, index) => {
    const prefix = `installments.${index}`;
    const { ok, errors: rowErrors } = validate(item || {}, {
      installment_date: 'nullable|string',
      description: 'nullable|string',
      amount: 'nullable|numeric|min:0',
      payment_method: 'nullable|string|in:Bank,Cash',
      bank_name: 'nullable|string|max:255',
      cheque_number: 'nullable|string|max:255',
      balance: 'nullable|numeric',
      remarks: 'nullable|string',
      bank_account_id: 'nullable|numeric',
      cheque_status: 'nullable|string|in:pending,cleared,bounced',
    });

    if (!ok) {
      for (const [field, messages] of Object.entries(rowErrors)) {
        errors[`${prefix}.${field}`] = messages;
      }
    }

    if (isUpdate && item?.id != null && item.id !== '') {
      if (Number.isNaN(Number(item.id))) {
        errors[`${prefix}.id`] = ['The installment id must be a number.'];
      }
    }
  });

  return { ok: Object.keys(errors).length === 0, errors };
}

async function validateInstallmentOwnership(installments, paymentHistoryId) {
  const errors = {};

  for (let i = 0; i < installments.length; i += 1) {
    const item = installments[i];
    if (item?.id == null || item.id === '') continue;

    const installment = await Installment.find(toInt(item.id));
    if (!installment || installment.payment_history_id !== paymentHistoryId) {
      errors[`installments.${i}.id`] = ['The selected installment id is invalid.'];
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

function applyPaymentFilters(qb, filters) {
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('showroom_name', term)
        .orWhere('nid_number', 'ILIKE', term)
        .orWhere('customer_name', 'ILIKE', term)
        .orWhere('contact_number', 'ILIKE', term)
        .orWhere('email', 'ILIKE', term)
        .orWhere('tin_certificate', 'ILIKE', term);
    });
  }

  if (isFilled(filters.car_id)) {
    qb.where('car_id', toInt(filters.car_id));
  }
  if (isFilled(filters.purchase_date_from)) {
    qb.where('purchase_date', '>=', filters.purchase_date_from);
  }
  if (isFilled(filters.purchase_date_to)) {
    qb.where('purchase_date', '<=', filters.purchase_date_to);
  }

  return qb;
}

function validatePaymentPayload(body, { isUpdate = false } = {}) {
  const { ok, errors } = validate(body, {
    car_id: 'nullable|numeric',
    showroom_name: 'nullable|string|max:255',
    wholesaler_address: 'nullable|string',
    purchase_amount: 'nullable|numeric|min:0',
    purchase_date: 'nullable|string',
    nid_number: 'nullable|string|max:255',
    customer_name: 'nullable|string|max:255',
    tin_certificate: 'nullable|string|max:255',
    customer_address: 'nullable|string',
    contact_number: 'nullable|string|max:255',
    email: 'nullable|email|max:255',
    installments: 'nullable|array',
  });

  if (!ok) return { ok, errors };

  const installmentCheck = validateInstallments(body.installments, { isUpdate });
  if (!installmentCheck.ok) {
    return installmentCheck;
  }

  return { ok: true, errors: {} };
}

export async function listPaymentHistories(filters) {
  let qb = applyPaymentFilters(PaymentHistory.query(), filters);

  const sortBy = SORTABLE_COLUMNS.has(filters.sort_by)
    ? filters.sort_by
    : 'created_at';
  const sortOrder = String(filters.sort_order || 'desc').toLowerCase() === 'asc'
    ? 'ASC'
    : 'DESC';
  qb = qb.orderBy(sortBy, sortOrder);

  const perPage = toInt(filters.per_page, 15);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);

  const paymentHistories = PaymentHistory.hydrateMany(rows);
  for (const paymentHistory of paymentHistories) {
    await paymentHistory.loadRelations();
  }

  return {
    message: 'Payment histories retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: paymentHistories,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    },
  };
}

export async function createPaymentHistory(body, meta = {}) {
  const parsedBody = parseInstallments(body);

  const { ok, errors } = validatePaymentPayload(parsedBody);
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const carCheck = await validateCarId(parsedBody.car_id);
  if (!carCheck.ok) throw new ValidationError(carCheck.errors, 'Validation error');
  await assertCarNotAlreadyPaid(parsedBody.car_id);

  const data = pickPaymentData(parsedBody);
  const normalizedInstallments = Array.isArray(parsedBody.installments)
    ? recomputeInstallmentBalances(data.purchase_amount, parsedBody.installments)
    : null;

  await assertPaymentDatesOpen(data.purchase_date, normalizedInstallments || []);

  const paymentHistory = await withTransaction(async (client) => {
    const created = await PaymentHistory.create(data, client);

    if (normalizedInstallments) {
      for (const installmentData of normalizedInstallments) {
        const payload = pickInstallmentData(installmentData);
        payload.payment_history_id = created.id;
        if (payload.payment_method === 'Bank' && !payload.cheque_status && payload.cheque_number) {
          payload.cheque_status = 'pending';
        }
        const installment = await Installment.create(payload, client);
        await syncInstallmentBankTransaction(installment, client);
      }
    }

    return created;
  });

  await paymentHistory.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'create',
    entityType: 'payment_history',
    entityId: paymentHistory.id,
    summary: `Created payment history #${paymentHistory.id}`,
    after: paymentHistory.toJSON?.() || paymentHistory,
    ip: meta.ip,
  });
  return {
    status: 201,
    message: 'Payment history created successfully',
    data: paymentHistory,
  };
}

export async function getPaymentHistory(id) {
  const paymentHistory = await PaymentHistory.find(id);
  if (!paymentHistory) {
    throw new NotFoundError('Payment history not found');
  }

  await paymentHistory.loadRelations();
  return {
    message: 'Payment history retrieved successfully',
    data: paymentHistory,
  };
}

export async function updatePaymentHistory(id, body, meta = {}) {
  const paymentHistory = await PaymentHistory.find(id);
  if (!paymentHistory) {
    throw new NotFoundError('Payment history not found');
  }

  const parsedBody = parseInstallments(body);

  const { ok, errors } = validatePaymentPayload(parsedBody, { isUpdate: true });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const carCheck = await validateCarId(parsedBody.car_id);
  if (!carCheck.ok) throw new ValidationError(carCheck.errors, 'Validation error');
  if (Object.prototype.hasOwnProperty.call(parsedBody, 'car_id')) {
    await assertCarNotAlreadyPaid(parsedBody.car_id, paymentHistory.id);
  }

  if (Object.prototype.hasOwnProperty.call(parsedBody, 'installments') && Array.isArray(parsedBody.installments)) {
    const ownershipCheck = await validateInstallmentOwnership(parsedBody.installments, paymentHistory.id);
    if (!ownershipCheck.ok) {
      throw new ValidationError(ownershipCheck.errors, 'Validation error');
    }
  }

  const data = pickPaymentData(parsedBody);
  const saleAmount = Object.prototype.hasOwnProperty.call(data, 'purchase_amount')
    ? data.purchase_amount
    : paymentHistory.purchase_amount;

  await assertPeriodOpen(
    paymentHistory.purchase_date || data.purchase_date || new Date(),
    'purchase_date'
  );
  await assertPaymentDatesOpen(
    data.purchase_date || paymentHistory.purchase_date,
    parsedBody.installments || []
  );

  const before = { ...paymentHistory.toJSON() };

  await withTransaction(async (client) => {
    await paymentHistory.update(data, client);

    if (Object.prototype.hasOwnProperty.call(parsedBody, 'installments') && Array.isArray(parsedBody.installments)) {
      const normalizedInstallments = recomputeInstallmentBalances(
        saleAmount,
        parsedBody.installments
      );

      const existingIds = normalizedInstallments
        .map((item) => toInt(item?.id))
        .filter((id) => id != null);

      const existingRows = await Installment.query(client)
        .where('payment_history_id', paymentHistory.id)
        .get();
      const removedIds = existingRows
        .map((row) => Number(row.id))
        .filter((id) => !existingIds.includes(id));
      if (removedIds.length) {
        await deleteSourceTransactions('installment', removedIds, client);
      }

      let deleteQb = Installment.query(client).where('payment_history_id', paymentHistory.id);
      if (existingIds.length) {
        deleteQb = deleteQb.whereNotIn('id', existingIds);
      }
      await deleteQb.delete();

      for (const installmentData of normalizedInstallments) {
        if (installmentData?.id != null && installmentData.id !== '') {
          const installment = await Installment.find(toInt(installmentData.id), client);
          if (installment && installment.payment_history_id === paymentHistory.id) {
            const payload = pickInstallmentData(installmentData);
            await installment.update(payload, client);
            const fresh = await Installment.find(installment.id, client);
            await syncInstallmentBankTransaction(fresh, client);
          }
        } else {
          const payload = pickInstallmentData(installmentData);
          payload.payment_history_id = paymentHistory.id;
          const created = await Installment.create(payload, client);
          await syncInstallmentBankTransaction(created, client);
        }
      }
    }
  });

  const fresh = await PaymentHistory.find(paymentHistory.id);
  await fresh.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'update',
    entityType: 'payment_history',
    entityId: fresh.id,
    summary: `Updated payment history #${fresh.id}`,
    before,
    after: fresh.toJSON?.() || fresh,
    ip: meta.ip,
  });
  return {
    message: 'Payment history updated successfully',
    data: fresh,
  };
}

export async function deletePaymentHistory(id, meta = {}) {
  const paymentHistory = await PaymentHistory.find(id);
  if (!paymentHistory) {
    throw new NotFoundError('Payment history not found');
  }

  await assertPeriodOpen(
    paymentHistory.purchase_date || new Date(),
    'purchase_date'
  );

  const before = paymentHistory.toJSON();

  await withTransaction(async (client) => {
    const installments = await Installment.query(client)
      .where('payment_history_id', paymentHistory.id)
      .get();
    const installmentIds = installments.map((row) => row.id);
    await deleteSourceTransactions('installment', installmentIds, client);
    await paymentHistory.delete(client);
  });

  await writeAudit({
    userId: meta.userId,
    action: 'delete',
    entityType: 'payment_history',
    entityId: id,
    summary: `Deleted payment history #${id}`,
    before,
    ip: meta.ip,
  });

  return {
    message: 'Payment history deleted successfully',
    data: null,
  };
}

export default {
  listPaymentHistories,
  createPaymentHistory,
  getPaymentHistory,
  updatePaymentHistory,
  deletePaymentHistory,
};
