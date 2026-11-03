// @ts-nocheck
import Expense from '../models/Expense.js';
import BankAccount from '../models/BankAccount.js';
import { withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import {
  upsertSourceTransaction,
  deleteSourceTransaction,
} from './BankAccountService.js';
import { assertPeriodOpen } from './PeriodLockService.js';
import { writeAudit } from './AuditService.js';

const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'transport',
  'utility',
  'marketing',
  'customs',
  'other',
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function pickExpenseData(body) {
  return {
    expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
    category: body.category || 'other',
    amount: toFloat(body.amount, 0),
    description: body.description ?? null,
    bank_account_id: toInt(body.bank_account_id),
    payment_method: body.payment_method ?? null,
    reference: body.reference ?? null,
  };
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

export async function listExpenses(filters = {}) {
  let qb = Expense.query();

  if (isFilled(filters.category)) qb = qb.where('category', filters.category);
  if (isFilled(filters.bank_account_id)) {
    qb = qb.where('bank_account_id', toInt(filters.bank_account_id));
  }
  if (isFilled(filters.from)) qb = qb.where('expense_date', '>=', filters.from);
  if (isFilled(filters.to)) qb = qb.where('expense_date', '<=', filters.to);
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('description', term).orWhere('reference', 'ILIKE', term);
    });
  }

  qb = qb.orderBy('expense_date', 'DESC').orderBy('id', 'DESC');
  const perPage = toInt(filters.per_page, 20);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const expenses = Expense.hydrateMany(rows);
  for (const expense of expenses) {
    await expense.loadRelations();
  }

  return {
    message: 'Expenses retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: expenses,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
      categories: EXPENSE_CATEGORIES,
    },
  };
}

export async function createExpense(body, meta = {}) {
  const { ok, errors } = validate(body || {}, {
    expense_date: 'nullable|string',
    category: `nullable|string|in:${EXPENSE_CATEGORIES.join(',')}`,
    amount: 'required|numeric|min:0',
    description: 'nullable|string',
    bank_account_id: 'required|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
    reference: 'nullable|string|max:255',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  await assertAccount(body.bank_account_id);
  const data = pickExpenseData(body);
  await assertPeriodOpen(data.expense_date, 'expense_date');

  const expense = await withTransaction(async (client) => {
    const created = await Expense.create(data, client);
    await upsertSourceTransaction(
      {
        bank_account_id: created.bank_account_id,
        txn_date: created.expense_date,
        type: 'out',
        amount: created.amount,
        reference: created.reference || `Expense #${created.id}`,
        notes: created.description,
        source_type: 'expense',
        source_id: created.id,
      },
      client
    );
    return created;
  });

  await expense.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'create',
    entityType: 'expense',
    entityId: expense.id,
    summary: `Created expense #${expense.id}`,
    after: expense.toJSON(),
    ip: meta.ip,
  });
  return {
    status: 201,
    message: 'Expense created successfully',
    data: expense,
  };
}

export async function getExpense(id) {
  const expense = await Expense.find(id);
  if (!expense) throw new NotFoundError('Expense not found');
  await expense.loadRelations();
  return {
    message: 'Expense retrieved successfully',
    data: expense,
  };
}

export async function updateExpense(id, body, meta = {}) {
  const expense = await Expense.find(id);
  if (!expense) throw new NotFoundError('Expense not found');

  const { ok, errors } = validate(body || {}, {
    expense_date: 'nullable|string',
    category: `nullable|string|in:${EXPENSE_CATEGORIES.join(',')}`,
    amount: 'nullable|numeric|min:0',
    description: 'nullable|string',
    bank_account_id: 'nullable|numeric',
    payment_method: 'nullable|string|in:Bank,Cash',
    reference: 'nullable|string|max:255',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  if (body.bank_account_id !== undefined) {
    await assertAccount(body.bank_account_id);
  }

  await assertPeriodOpen(expense.expense_date, 'expense_date');
  if (body.expense_date) await assertPeriodOpen(body.expense_date, 'expense_date');

  const data = {};
  for (const key of [
    'expense_date', 'category', 'description', 'payment_method', 'reference',
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.amount !== undefined) data.amount = toFloat(body.amount, expense.amount);
  if (body.bank_account_id !== undefined) data.bank_account_id = toInt(body.bank_account_id);

  const before = expense.toJSON();
  await withTransaction(async (client) => {
    await expense.update(data, client);
    const fresh = await Expense.find(expense.id, client);
    await upsertSourceTransaction(
      {
        bank_account_id: fresh.bank_account_id,
        txn_date: fresh.expense_date,
        type: 'out',
        amount: fresh.amount,
        reference: fresh.reference || `Expense #${fresh.id}`,
        notes: fresh.description,
        source_type: 'expense',
        source_id: fresh.id,
      },
      client
    );
  });

  const updated = await Expense.find(expense.id);
  await updated.loadRelations();
  await writeAudit({
    userId: meta.userId,
    action: 'update',
    entityType: 'expense',
    entityId: updated.id,
    summary: `Updated expense #${updated.id}`,
    before,
    after: updated.toJSON(),
    ip: meta.ip,
  });
  return {
    message: 'Expense updated successfully',
    data: updated,
  };
}

export async function deleteExpense(id, meta = {}) {
  const expense = await Expense.find(id);
  if (!expense) throw new NotFoundError('Expense not found');
  await assertPeriodOpen(expense.expense_date, 'expense_date');
  const before = expense.toJSON();

  await withTransaction(async (client) => {
    await deleteSourceTransaction('expense', expense.id, client);
    await expense.delete(client);
  });

  await writeAudit({
    userId: meta.userId,
    action: 'delete',
    entityType: 'expense',
    entityId: id,
    summary: `Deleted expense #${id}`,
    before,
    ip: meta.ip,
  });

  return {
    message: 'Expense deleted successfully',
    data: null,
  };
}

export { EXPENSE_CATEGORIES };

export default {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
};
