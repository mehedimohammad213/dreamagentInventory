// @ts-nocheck
import CarExtraCost from '../models/CarExtraCost.js';
import Car from '../models/Car.js';
import BankAccount from '../models/BankAccount.js';
import { withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import {
  upsertSourceTransaction,
  deleteSourceTransaction,
} from './BankAccountService.js';
import { assertPeriodOpen } from './PeriodLockService.js';

export const EXTRA_COST_CATEGORIES = [
  'repair',
  'transport',
  'reconditioning',
  'documentation',
  'other',
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

async function assertCar(carId) {
  const car = await Car.find(toInt(carId));
  if (!car) {
    throw new ValidationError(
      { car_id: ['The selected car is invalid.'] },
      'Validation error'
    );
  }
  return car;
}

async function assertAccountIfProvided(accountId) {
  if (accountId == null || accountId === '') return null;
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
    car_id: toInt(body.car_id),
    cost_date: body.cost_date || new Date().toISOString().slice(0, 10),
    category: body.category || 'other',
    amount: toFloat(body.amount, 0),
    description: body.description ?? null,
    bank_account_id:
      body.bank_account_id === '' || body.bank_account_id == null
        ? null
        : toInt(body.bank_account_id),
    payment_method: body.payment_method ?? null,
  };
}

async function syncBankTxn(extraCost, client = null) {
  if (!extraCost.bank_account_id || !extraCost.amount) {
    await deleteSourceTransaction('car_extra_cost', extraCost.id, client);
    return;
  }
  await upsertSourceTransaction(
    {
      bank_account_id: extraCost.bank_account_id,
      txn_date: extraCost.cost_date,
      type: 'out',
      amount: extraCost.amount,
      reference: `Car extra cost #${extraCost.id}`,
      notes: extraCost.description || extraCost.category,
      source_type: 'car_extra_cost',
      source_id: extraCost.id,
    },
    client
  );
}

export async function listExtraCosts(filters = {}) {
  let qb = CarExtraCost.query();

  if (isFilled(filters.car_id)) qb = qb.where('car_id', toInt(filters.car_id));
  if (isFilled(filters.category)) qb = qb.where('category', filters.category);
  if (isFilled(filters.from)) qb = qb.where('cost_date', '>=', filters.from);
  if (isFilled(filters.to)) qb = qb.where('cost_date', '<=', filters.to);

  qb = qb.orderBy('cost_date', 'DESC').orderBy('id', 'DESC');
  const perPage = toInt(filters.per_page, 50);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const items = CarExtraCost.hydrateMany(rows);
  for (const item of items) {
    await item.loadRelations();
  }

  return {
    message: 'Car extra costs retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: items,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
      categories: EXTRA_COST_CATEGORIES,
    },
  };
}

export async function createExtraCost(body) {
  const { ok, errors } = validate(body || {}, {
    car_id: 'required|numeric',
    cost_date: 'nullable|string',
    category: `nullable|string|in:${EXTRA_COST_CATEGORIES.join(',')}`,
    amount: 'required|numeric|min:0',
    description: 'nullable|string',
    bank_account_id: 'nullable|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  await assertCar(body.car_id);
  await assertAccountIfProvided(body.bank_account_id);
  const data = pickData(body);
  await assertPeriodOpen(data.cost_date, 'cost_date');

  const item = await withTransaction(async (client) => {
    const created = await CarExtraCost.create(data, client);
    await syncBankTxn(created, client);
    return created;
  });

  await item.loadRelations();
  return {
    status: 201,
    message: 'Car extra cost created successfully',
    data: item,
  };
}

export async function updateExtraCost(id, body) {
  const item = await CarExtraCost.find(id);
  if (!item) throw new NotFoundError('Car extra cost not found');

  const { ok, errors } = validate(body || {}, {
    car_id: 'nullable|numeric',
    cost_date: 'nullable|string',
    category: `nullable|string|in:${EXTRA_COST_CATEGORIES.join(',')}`,
    amount: 'nullable|numeric|min:0',
    description: 'nullable|string',
    bank_account_id: 'nullable|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  if (body.car_id !== undefined) await assertCar(body.car_id);
  if (body.bank_account_id !== undefined) await assertAccountIfProvided(body.bank_account_id);
  await assertPeriodOpen(item.cost_date, 'cost_date');
  if (body.cost_date) await assertPeriodOpen(body.cost_date, 'cost_date');

  const data = {};
  for (const key of ['cost_date', 'category', 'description', 'payment_method']) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.car_id !== undefined) data.car_id = toInt(body.car_id);
  if (body.amount !== undefined) data.amount = toFloat(body.amount, item.amount);
  if (body.bank_account_id !== undefined) {
    data.bank_account_id =
      body.bank_account_id === '' || body.bank_account_id == null
        ? null
        : toInt(body.bank_account_id);
  }

  await withTransaction(async (client) => {
    await item.update(data, client);
    const fresh = await CarExtraCost.find(item.id, client);
    await syncBankTxn(fresh, client);
  });

  const updated = await CarExtraCost.find(item.id);
  await updated.loadRelations();
  return {
    message: 'Car extra cost updated successfully',
    data: updated,
  };
}

export async function deleteExtraCost(id) {
  const item = await CarExtraCost.find(id);
  if (!item) throw new NotFoundError('Car extra cost not found');
  await assertPeriodOpen(item.cost_date, 'cost_date');

  await withTransaction(async (client) => {
    await deleteSourceTransaction('car_extra_cost', item.id, client);
    await item.delete(client);
  });

  return {
    message: 'Car extra cost deleted successfully',
    data: null,
  };
}

export default {
  listExtraCosts,
  createExtraCost,
  updateExtraCost,
  deleteExtraCost,
  EXTRA_COST_CATEGORIES,
};
