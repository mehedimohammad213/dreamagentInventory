// @ts-nocheck
import AccountingPeriod from '../models/AccountingPeriod.js';
import { validate, toInt } from '../utils/validate.js';
import { ValidationError, NotFoundError, AppError } from '../lib/errors.js';
import { writeAudit } from './AuditService.js';

export function toYearMonth(dateValue) {
  if (!dateValue) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const raw = String(dateValue);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    // try YYYY-MM-DD
    const m = raw.match(/^(\d{4})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}`;
    throw new ValidationError({ date: ['Invalid date for period lock check.'] }, 'Validation error');
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function isPeriodLocked(dateValue) {
  const yearMonth = toYearMonth(dateValue);
  const period = await AccountingPeriod.query()
    .where('year_month', yearMonth)
    .where('is_locked', true)
    .first();
  return Boolean(period);
}

export async function assertPeriodOpen(dateValue, field = 'date') {
  const yearMonth = toYearMonth(dateValue);
  const locked = await isPeriodLocked(yearMonth);
  if (locked) {
    throw new ValidationError(
      { [field]: [`Accounting period ${yearMonth} is locked.`] },
      `Accounting period ${yearMonth} is locked.`
    );
  }
  return yearMonth;
}

export async function listPeriods() {
  const rows = await AccountingPeriod.query()
    .orderBy('year_month', 'DESC')
    .get();
  return {
    message: 'Accounting periods retrieved successfully',
    data: AccountingPeriod.hydrateMany(rows),
  };
}

export async function lockPeriod(body, actor) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403);
  }

  const { ok, errors } = validate(body || {}, {
    year_month: 'required|string',
    notes: 'nullable|string',
  });
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const yearMonth = toYearMonth(body.year_month);
  let period = await AccountingPeriod.query().where('year_month', yearMonth).first();
  period = period ? AccountingPeriod.hydrate(period) : null;

  if (period?.is_locked) {
    return {
      message: 'Period already locked',
      data: period,
    };
  }

  if (period) {
    await period.update({
      is_locked: true,
      locked_at: new Date(),
      locked_by: actor.id,
      notes: body.notes ?? period.notes,
    });
  } else {
    period = await AccountingPeriod.create({
      year_month: yearMonth,
      is_locked: true,
      locked_at: new Date(),
      locked_by: actor.id,
      notes: body.notes ?? null,
    });
  }

  await writeAudit({
    userId: actor.id,
    action: 'lock',
    entityType: 'accounting_period',
    entityId: period.id,
    summary: `Locked period ${yearMonth}`,
    after: period.toJSON(),
  });

  return {
    message: `Period ${yearMonth} locked successfully`,
    data: period,
  };
}

export async function unlockPeriod(yearMonthInput, actor, body = {}) {
  if (!actor || actor.role !== 'admin') {
    throw new AppError('Forbidden', 403);
  }

  const yearMonth = toYearMonth(yearMonthInput);
  const row = await AccountingPeriod.query().where('year_month', yearMonth).first();
  if (!row) throw new NotFoundError('Accounting period not found');
  const period = AccountingPeriod.hydrate(row);

  if (!period.is_locked) {
    return {
      message: 'Period already unlocked',
      data: period,
    };
  }

  const before = period.toJSON();
  await period.update({
    is_locked: false,
    locked_at: null,
    locked_by: null,
    notes: body.notes ?? period.notes,
  });

  await writeAudit({
    userId: actor.id,
    action: 'unlock',
    entityType: 'accounting_period',
    entityId: period.id,
    summary: `Unlocked period ${yearMonth}`,
    before,
    after: period.toJSON(),
  });

  return {
    message: `Period ${yearMonth} unlocked successfully`,
    data: period,
  };
}

export default {
  toYearMonth,
  isPeriodLocked,
  assertPeriodOpen,
  listPeriods,
  lockPeriod,
  unlockPeriod,
};
