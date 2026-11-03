// @ts-nocheck
import type { PoolClient } from 'pg';
import BankAccount from '../models/BankAccount.js';
import BankTransaction from '../models/BankTransaction.js';
import { query, withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import { assertPeriodOpen } from './PeriodLockService.js';
import { writeAudit } from './AuditService.js';

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

export async function getAccountBalance(accountId, client = null) {
  const account = await BankAccount.find(accountId, client);
  if (!account) return 0;

  const result = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) AS total_in,
       COALESCE(SUM(CASE WHEN type IN ('out', 'transfer') THEN amount ELSE 0 END), 0) AS total_out
     FROM bank_transactions
     WHERE bank_account_id = $1`,
    [accountId],
    client
  );

  const totalIn = Number(result.rows[0]?.total_in || 0);
  const totalOut = Number(result.rows[0]?.total_out || 0);
  return Number(account.opening_balance || 0) + totalIn - totalOut;
}

export async function attachBalances(accounts) {
  const list = Array.isArray(accounts) ? accounts : [accounts];
  for (const account of list) {
    account.current_balance = await getAccountBalance(account.id);
  }
  return accounts;
}

export async function upsertSourceTransaction(
  {
    bank_account_id,
    txn_date,
    type,
    amount,
    reference = null,
    notes = null,
    source_type,
    source_id,
    related_account_id = null,
  },
  client = null
) {
  if (!bank_account_id || amount == null || Number(amount) <= 0) {
    await deleteSourceTransaction(source_type, source_id, client);
    return null;
  }

  const account = await BankAccount.find(bank_account_id, client);
  if (!account || !account.is_active) {
    throw new ValidationError(
      { bank_account_id: ['The selected bank account is invalid or inactive.'] },
      'Validation error'
    );
  }

  const existing = await BankTransaction.query(client)
    .where('source_type', source_type)
    .where('source_id', source_id)
    .first();

  const payload = {
    bank_account_id: toInt(bank_account_id),
    txn_date: txn_date || new Date().toISOString().slice(0, 10),
    type,
    amount: toFloat(amount, 0),
    reference,
    notes,
    source_type,
    source_id: toInt(source_id),
    related_account_id: related_account_id == null ? null : toInt(related_account_id),
  };

  if (existing) {
    const model = BankTransaction.hydrate(existing);
    await model.update(payload, client);
    return model;
  }

  return BankTransaction.create(payload, client);
}

export async function deleteSourceTransaction(source_type, source_id, client = null) {
  if (source_type == null || source_id == null) return;
  await BankTransaction.query(client)
    .where('source_type', source_type)
    .where('source_id', toInt(source_id))
    .delete();
}

export async function deleteSourceTransactions(source_type, sourceIds, client = null) {
  const ids = (sourceIds || []).map((id) => toInt(id)).filter((id) => id != null);
  if (!ids.length) return;
  await BankTransaction.query(client)
    .where('source_type', source_type)
    .whereIn('source_id', ids)
    .delete();
}

export async function ensureDefaultCashAccount(client = null) {
  const existing = await BankAccount.query(client)
    .where('account_type', 'cash')
    .orderBy('id', 'ASC')
    .first();
  if (existing) return BankAccount.hydrate(existing);

  return BankAccount.create(
    {
      name: 'Cash',
      account_type: 'cash',
      currency: 'BDT',
      opening_balance: 0,
      opening_balance_date: new Date().toISOString().slice(0, 10),
      is_active: true,
      notes: 'Default cash account',
    },
    client
  );
}

export async function resolveAccountForPaymentMethod(paymentMethod, bankAccountId, client = null) {
  if (bankAccountId != null && bankAccountId !== '') {
    const account = await BankAccount.find(toInt(bankAccountId), client);
    if (!account || !account.is_active) {
      throw new ValidationError(
        { bank_account_id: ['The selected bank account is invalid or inactive.'] },
        'Validation error'
      );
    }
    return account;
  }

  if (paymentMethod === 'Cash') {
    return ensureDefaultCashAccount(client);
  }

  return null;
}

export async function listAccounts(filters = {}) {
  let qb = BankAccount.query();

  if (isFilled(filters.account_type)) {
    qb = qb.where('account_type', filters.account_type);
  }
  if (filters.is_active === 'true' || filters.is_active === true) {
    qb = qb.where('is_active', true);
  } else if (filters.is_active === 'false' || filters.is_active === false) {
    qb = qb.where('is_active', false);
  }
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('name', term)
        .orWhere('bank_name', 'ILIKE', term)
        .orWhere('account_number', 'ILIKE', term)
        .orWhere('branch_name', 'ILIKE', term);
    });
  }

  qb = qb.orderBy('account_type', 'ASC').orderBy('name', 'ASC');
  const rows = await qb.get();
  const accounts = BankAccount.hydrateMany(rows);
  await attachBalances(accounts);

  return {
    message: 'Bank accounts retrieved successfully',
    data: accounts,
  };
}

export async function createAccount(body) {
  const { ok, errors } = validate(body || {}, {
    name: 'required|string|max:255',
    bank_name: 'nullable|string|max:255',
    branch_name: 'nullable|string|max:255',
    account_number: 'nullable|string|max:64',
    account_type: 'required|string|in:bank,cash',
    currency: 'nullable|string|max:3',
    opening_balance: 'nullable|numeric',
    opening_balance_date: 'nullable|string',
    is_active: 'nullable',
    notes: 'nullable|string',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const account = await BankAccount.create({
    name: body.name,
    bank_name: body.bank_name ?? null,
    branch_name: body.branch_name ?? null,
    account_number: body.account_number ?? null,
    account_type: body.account_type,
    currency: body.currency || 'BDT',
    opening_balance: toFloat(body.opening_balance, 0) ?? 0,
    opening_balance_date: body.opening_balance_date || null,
    is_active: body.is_active === false || body.is_active === 'false' ? false : true,
    notes: body.notes ?? null,
  });

  account.current_balance = await getAccountBalance(account.id);
  return {
    status: 201,
    message: 'Bank account created successfully',
    data: account,
  };
}

export async function getAccount(id) {
  const account = await BankAccount.find(id);
  if (!account) throw new NotFoundError('Bank account not found');
  account.current_balance = await getAccountBalance(account.id);
  return {
    message: 'Bank account retrieved successfully',
    data: account,
  };
}

export async function updateAccount(id, body) {
  const account = await BankAccount.find(id);
  if (!account) throw new NotFoundError('Bank account not found');

  const { ok, errors } = validate(body || {}, {
    name: 'nullable|string|max:255',
    bank_name: 'nullable|string|max:255',
    branch_name: 'nullable|string|max:255',
    account_number: 'nullable|string|max:64',
    account_type: 'nullable|string|in:bank,cash',
    currency: 'nullable|string|max:3',
    opening_balance: 'nullable|numeric',
    opening_balance_date: 'nullable|string',
    is_active: 'nullable',
    notes: 'nullable|string',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const payload = {};
  for (const key of [
    'name', 'bank_name', 'branch_name', 'account_number', 'account_type',
    'currency', 'opening_balance_date', 'notes',
  ]) {
    if (body[key] !== undefined) payload[key] = body[key];
  }
  if (body.opening_balance !== undefined) {
    payload.opening_balance = toFloat(body.opening_balance, account.opening_balance);
  }
  if (body.is_active !== undefined) {
    payload.is_active = !(body.is_active === false || body.is_active === 'false');
  }

  await account.update(payload);
  const fresh = await BankAccount.find(account.id);
  fresh.current_balance = await getAccountBalance(fresh.id);
  return {
    message: 'Bank account updated successfully',
    data: fresh,
  };
}

export async function deleteAccount(id) {
  const account = await BankAccount.find(id);
  if (!account) throw new NotFoundError('Bank account not found');

  const txnCount = await BankTransaction.query().where('bank_account_id', account.id).count();
  if (Number(txnCount) > 0) {
    throw new ValidationError(
      { id: ['Cannot delete an account that has transactions. Deactivate it instead.'] },
      'Cannot delete an account that has transactions. Deactivate it instead.'
    );
  }

  await account.delete();
  return {
    message: 'Bank account deleted successfully',
    data: null,
  };
}

export async function listTransactions(filters = {}) {
  let qb = BankTransaction.query();

  if (isFilled(filters.bank_account_id)) {
    qb = qb.where('bank_account_id', toInt(filters.bank_account_id));
  }
  if (isFilled(filters.type)) {
    qb = qb.where('type', filters.type);
  }
  if (isFilled(filters.from)) {
    qb = qb.where('txn_date', '>=', filters.from);
  }
  if (isFilled(filters.to)) {
    qb = qb.where('txn_date', '<=', filters.to);
  }

  qb = qb.orderBy('txn_date', 'DESC').orderBy('id', 'DESC');

  const perPage = toInt(filters.per_page, 50);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const transactions = BankTransaction.hydrateMany(rows);

  return {
    message: 'Transactions retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: transactions,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    },
  };
}

export async function createManualTransaction(body, meta = {}) {
  const { ok, errors } = validate(body || {}, {
    bank_account_id: 'required|numeric',
    txn_date: 'nullable|string',
    type: 'required|string|in:in,out',
    amount: 'required|numeric|min:0',
    reference: 'nullable|string|max:255',
    notes: 'nullable|string',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const account = await BankAccount.find(toInt(body.bank_account_id));
  if (!account || !account.is_active) {
    throw new ValidationError(
      { bank_account_id: ['The selected bank account is invalid or inactive.'] },
      'Validation error'
    );
  }

  const txnDate = body.txn_date || new Date().toISOString().slice(0, 10);
  await assertPeriodOpen(txnDate, 'txn_date');

  const txn = await BankTransaction.create({
    bank_account_id: account.id,
    txn_date: txnDate,
    type: body.type,
    amount: toFloat(body.amount, 0),
    reference: body.reference ?? null,
    notes: body.notes ?? null,
    source_type: 'manual',
    source_id: null,
  });

  await writeAudit({
    userId: meta.userId,
    action: 'create',
    entityType: 'bank_transaction',
    entityId: txn.id,
    summary: `Manual ${body.type} on account #${account.id}`,
    after: txn.toJSON(),
    ip: meta.ip,
  });

  return {
    status: 201,
    message: 'Transaction created successfully',
    data: txn,
  };
}

export async function transfer(body, meta = {}) {
  const { ok, errors } = validate(body || {}, {
    from_account_id: 'required|numeric',
    to_account_id: 'required|numeric',
    amount: 'required|numeric|min:0',
    txn_date: 'nullable|string',
    notes: 'nullable|string',
    reference: 'nullable|string|max:255',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const fromId = toInt(body.from_account_id);
  const toId = toInt(body.to_account_id);
  if (fromId === toId) {
    throw new ValidationError(
      { to_account_id: ['Cannot transfer to the same account.'] },
      'Validation error'
    );
  }

  const amount = toFloat(body.amount, 0);
  if (!amount || amount <= 0) {
    throw new ValidationError({ amount: ['Amount must be greater than 0.'] }, 'Validation error');
  }

  const txnDate = body.txn_date || new Date().toISOString().slice(0, 10);
  await assertPeriodOpen(txnDate, 'txn_date');

  const result = await withTransaction(async (client: PoolClient) => {
    const from = await BankAccount.find(fromId, client);
    const to = await BankAccount.find(toId, client);
    if (!from || !from.is_active) {
      throw new ValidationError(
        { from_account_id: ['The source account is invalid or inactive.'] },
        'Validation error'
      );
    }
    if (!to || !to.is_active) {
      throw new ValidationError(
        { to_account_id: ['The destination account is invalid or inactive.'] },
        'Validation error'
      );
    }

    const balance = await getAccountBalance(fromId, client);
    if (balance < amount) {
      throw new ValidationError(
        { amount: ['Insufficient balance in the source account.'] },
        'Insufficient balance in the source account.'
      );
    }

    const reference = body.reference || `Transfer ${from.name} → ${to.name}`;

    const outTxn = await BankTransaction.create(
      {
        bank_account_id: fromId,
        txn_date: txnDate,
        type: 'transfer',
        amount,
        reference,
        notes: body.notes ?? null,
        source_type: 'transfer',
        source_id: null,
        related_account_id: toId,
      },
      client
    );

    const inTxn = await BankTransaction.create(
      {
        bank_account_id: toId,
        txn_date: txnDate,
        type: 'in',
        amount,
        reference,
        notes: body.notes ?? null,
        source_type: 'transfer',
        source_id: outTxn.id,
        related_account_id: fromId,
      },
      client
    );

    // Link outbound transfer to inbound for uniqueness on inbound side
    await outTxn.update({ source_id: inTxn.id }, client);

    return { out: outTxn, in: inTxn };
  });

  await writeAudit({
    userId: meta.userId,
    action: 'transfer',
    entityType: 'bank_transaction',
    entityId: result.out?.id,
    summary: `Transfer ${amount} from #${fromId} to #${toId}`,
    after: result,
    ip: meta.ip,
  });

  return {
    status: 201,
    message: 'Transfer completed successfully',
    data: result,
  };
}

export default {
  listAccounts,
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  listTransactions,
  createManualTransaction,
  transfer,
  getAccountBalance,
  attachBalances,
  upsertSourceTransaction,
  deleteSourceTransaction,
  deleteSourceTransactions,
  ensureDefaultCashAccount,
  resolveAccountForPaymentMethod,
};
