// @ts-nocheck
import { query, withTransaction } from '../db/pool.js';
import { toInt, toFloat, validate } from '../utils/validate.js';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import * as BankAccountService from './BankAccountService.js';
import { EXPENSE_CATEGORIES } from './ExpenseService.js';

function toNum(value) {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function landedCostFromPurchase(row) {
  return (
    toNum(row.purchase_amount) +
    toNum(row.govt_duty) +
    toNum(row.cnf_amount) +
    toNum(row.miscellaneous)
  );
}

async function getExtraCostsByCar(carIds = null) {
  const params = [];
  let where = '';
  if (Array.isArray(carIds) && carIds.length) {
    params.push(carIds);
    where = `WHERE car_id = ANY($1)`;
  }
  const result = await query(
    `SELECT car_id, COALESCE(SUM(amount), 0) AS extra_total
     FROM car_extra_costs
     ${where}
     GROUP BY car_id`,
    params
  );
  const map = new Map();
  for (const row of result.rows) {
    map.set(Number(row.car_id), toNum(row.extra_total));
  }
  return map;
}

/**
 * Build per-car purchase cost with multi-car LC allocation:
 * - if allocated_cost set on pivot → use it
 * - else equal split of batch landed cost across linked cars
 */
export async function getCostPerCar(filters = {}) {
  const params = [];
  const where = [];

  if (isFilled(filters.from)) {
    params.push(filters.from);
    where.push(`ph.purchase_date >= $${params.length}`);
  }
  if (isFilled(filters.to)) {
    params.push(filters.to);
    where.push(`ph.purchase_date <= $${params.length}`);
  }
  if (isFilled(filters.search)) {
    params.push(`%${filters.search}%`);
    where.push(`(
      c.chassis_no_full ILIKE $${params.length}
      OR c.make ILIKE $${params.length}
      OR c.model ILIKE $${params.length}
      OR ph.lc_number ILIKE $${params.length}
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT
       c.id AS car_id,
       c.make,
       c.model,
       c.year,
       c.chassis_no_full,
       c.status AS car_status,
       ph.id AS purchase_history_id,
       ph.purchase_date,
       ph.lc_number,
       ph.purchase_amount,
       ph.govt_duty,
       ph.cnf_amount,
       ph.miscellaneous,
       ph.foreign_amount,
       ph.bdt_amount,
       cph.allocated_cost,
       (
         SELECT COUNT(*)::int
         FROM car_purchase_history cph2
         WHERE cph2.purchase_history_id = ph.id
       ) AS cars_in_batch
     FROM cars c
     INNER JOIN car_purchase_history cph ON cph.car_id = c.id
     INNER JOIN purchase_history ph ON ph.id = cph.purchase_history_id
     ${whereSql}
     ORDER BY ph.purchase_date DESC NULLS LAST, c.id DESC`,
    params
  );

  const carIds = [...new Set(result.rows.map((r) => Number(r.car_id)))];
  const extraByCar = await getExtraCostsByCar(carIds.length ? carIds : null);

  const data = result.rows.map((row) => {
    const batchCost = landedCostFromPurchase(row);
    const carsInBatch = Math.max(Number(row.cars_in_batch) || 1, 1);
    const allocated =
      row.allocated_cost != null && row.allocated_cost !== ''
        ? toNum(row.allocated_cost)
        : round2(batchCost / carsInBatch);
    const extra_cost = extraByCar.get(Number(row.car_id)) || 0;
    const purchase_cost = allocated;
    const total_cost = round2(purchase_cost + extra_cost);

    return {
      car_id: Number(row.car_id),
      make: row.make,
      model: row.model,
      year: row.year,
      chassis_no_full: row.chassis_no_full,
      car_status: row.car_status,
      purchase_history_id: Number(row.purchase_history_id),
      purchase_date: row.purchase_date,
      lc_number: row.lc_number,
      purchase_amount: toNum(row.purchase_amount),
      govt_duty: toNum(row.govt_duty),
      cnf_amount: toNum(row.cnf_amount),
      miscellaneous: toNum(row.miscellaneous),
      foreign_amount: toNum(row.foreign_amount),
      bdt_amount: toNum(row.bdt_amount),
      batch_landed_cost: batchCost,
      cars_in_batch: carsInBatch,
      allocated_cost: row.allocated_cost == null ? null : toNum(row.allocated_cost),
      purchase_cost,
      extra_cost,
      total_cost,
      allocation_mode: row.allocated_cost == null ? 'equal_split' : 'manual',
    };
  });

  // Totals: sum purchase allocations once per row; sum extras once per car
  const extrasCounted = new Set();
  let total_purchase_cost = 0;
  let total_extra_cost = 0;
  for (const row of data) {
    total_purchase_cost += row.purchase_cost;
    if (!extrasCounted.has(row.car_id)) {
      total_extra_cost += row.extra_cost;
      extrasCounted.add(row.car_id);
    }
  }
  const total_cost = round2(total_purchase_cost + total_extra_cost);

  return {
    message: 'Cost per car retrieved successfully',
    data: {
      rows: data,
      totals: {
        count: data.length,
        total_purchase_cost: round2(total_purchase_cost),
        total_extra_cost: round2(total_extra_cost),
        total_cost: round2(total_cost),
      },
    },
  };
}

export async function setLcAllocations(purchaseHistoryId, body) {
  const id = toInt(purchaseHistoryId);
  const ph = await query(`SELECT * FROM purchase_history WHERE id = $1`, [id]);
  if (!ph.rows.length) throw new NotFoundError('Purchase history not found');

  const batchCost = landedCostFromPurchase(ph.rows[0]);
  const links = await query(
    `SELECT id, car_id, allocated_cost FROM car_purchase_history WHERE purchase_history_id = $1`,
    [id]
  );
  if (!links.rows.length) {
    throw new ValidationError(
      { purchase_history_id: ['No cars linked to this purchase.'] },
      'Validation error'
    );
  }

  const mode = body?.mode === 'manual' ? 'manual' : 'equal_split';

  if (mode === 'equal_split') {
    const share = round2(batchCost / links.rows.length);
    await withTransaction(async (client) => {
      for (let i = 0; i < links.rows.length; i += 1) {
        // Put remainder on last car to keep sum exact
        const amount =
          i === links.rows.length - 1
            ? round2(batchCost - share * (links.rows.length - 1))
            : share;
        await query(
          `UPDATE car_purchase_history
           SET allocated_cost = $1, updated_at = NOW()
           WHERE id = $2`,
          [amount, links.rows[i].id],
          client
        );
      }
    });
  } else {
    const allocations = Array.isArray(body?.allocations) ? body.allocations : [];
    const { ok, errors } = validate(
      { allocations },
      { allocations: 'required|array' }
    );
    if (!ok) throw new ValidationError(errors, 'Validation error');

    const byCar = new Map();
    for (const item of allocations) {
      const carId = toInt(item?.car_id);
      const amount = toFloat(item?.allocated_cost, null);
      if (carId == null || amount == null) {
        throw new ValidationError(
          { allocations: ['Each allocation needs car_id and allocated_cost.'] },
          'Validation error'
        );
      }
      byCar.set(carId, amount);
    }

    for (const link of links.rows) {
      if (!byCar.has(Number(link.car_id))) {
        throw new ValidationError(
          { allocations: [`Missing allocation for car ${link.car_id}.`] },
          'Validation error'
        );
      }
    }

    const sum = [...byCar.values()].reduce((s, n) => s + Number(n), 0);
    if (Math.abs(sum - batchCost) > 0.05) {
      throw new ValidationError(
        {
          allocations: [
            `Allocations sum (${sum}) must equal batch landed cost (${batchCost}).`,
          ],
        },
        'Validation error'
      );
    }

    await withTransaction(async (client) => {
      for (const link of links.rows) {
        await query(
          `UPDATE car_purchase_history
           SET allocated_cost = $1, updated_at = NOW()
           WHERE id = $2`,
          [byCar.get(Number(link.car_id)), link.id],
          client
        );
      }
    });
  }

  const refreshed = await getCostPerCar({
    // no date filter — return rows for this purchase only via searchless full then filter
  });
  const rows = refreshed.data.rows.filter(
    (r) => r.purchase_history_id === id
  );

  return {
    message: 'LC allocations updated successfully',
    data: {
      purchase_history_id: id,
      batch_landed_cost: batchCost,
      rows,
    },
  };
}

export async function getCollectionPerCar(filters = {}) {
  const params = [];
  const where = [];

  if (isFilled(filters.from)) {
    params.push(filters.from);
    where.push(`pay.purchase_date >= $${params.length}`);
  }
  if (isFilled(filters.to)) {
    params.push(filters.to);
    where.push(`pay.purchase_date <= $${params.length}`);
  }
  if (isFilled(filters.search)) {
    params.push(`%${filters.search}%`);
    where.push(`(
      c.chassis_no_full ILIKE $${params.length}
      OR pay.customer_name ILIKE $${params.length}
      OR pay.showroom_name ILIKE $${params.length}
      OR pay.contact_number ILIKE $${params.length}
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT
       pay.id AS payment_history_id,
       pay.car_id,
       pay.customer_name,
       pay.showroom_name,
       pay.contact_number,
       pay.email,
       pay.nid_number,
       pay.purchase_amount AS sale_amount,
       pay.purchase_date AS sale_date,
       c.make,
       c.model,
       c.year,
       c.chassis_no_full,
       c.status AS car_status,
       COALESCE(SUM(i.amount), 0) AS collected,
       COUNT(i.id) AS installment_count,
       MAX(i.installment_date) AS last_payment_date
     FROM payment_history pay
     LEFT JOIN cars c ON c.id = pay.car_id
     LEFT JOIN installments i ON i.payment_history_id = pay.id
     ${whereSql}
     GROUP BY
       pay.id, pay.car_id, pay.customer_name, pay.showroom_name, pay.contact_number,
       pay.email, pay.nid_number, pay.purchase_amount, pay.purchase_date,
       c.make, c.model, c.year, c.chassis_no_full, c.status
     ORDER BY pay.purchase_date DESC NULLS LAST, pay.id DESC`,
    params
  );

  const data = result.rows.map((row) => {
    const sale = toNum(row.sale_amount);
    const collected = toNum(row.collected);
    return {
      payment_history_id: Number(row.payment_history_id),
      car_id: row.car_id == null ? null : Number(row.car_id),
      customer_name: row.customer_name,
      showroom_name: row.showroom_name,
      contact_number: row.contact_number,
      email: row.email,
      nid_number: row.nid_number,
      make: row.make,
      model: row.model,
      year: row.year,
      chassis_no_full: row.chassis_no_full,
      car_status: row.car_status,
      sale_date: row.sale_date,
      sale_amount: sale,
      collected,
      due: Math.max(sale - collected, 0),
      installment_count: Number(row.installment_count || 0),
      last_payment_date: row.last_payment_date,
    };
  });

  const totals = data.reduce(
    (acc, row) => {
      acc.sale_amount += row.sale_amount;
      acc.collected += row.collected;
      acc.due += row.due;
      return acc;
    },
    { count: data.length, sale_amount: 0, collected: 0, due: 0 }
  );

  return {
    message: 'Collection per car retrieved successfully',
    data: { rows: data, totals },
  };
}

export async function getSummary(filters = {}) {
  const accountsResult = await BankAccountService.listAccounts({ is_active: true });
  const accounts = accountsResult.data || [];
  const total_balance = accounts.reduce(
    (sum, a) => sum + Number(a.current_balance || 0),
    0
  );

  const cost = await getCostPerCar(filters);
  const collection = await getCollectionPerCar(filters);

  const expenseParams = [];
  const expenseWhere = [];
  if (isFilled(filters.from)) {
    expenseParams.push(filters.from);
    expenseWhere.push(`expense_date >= $${expenseParams.length}`);
  }
  if (isFilled(filters.to)) {
    expenseParams.push(filters.to);
    expenseWhere.push(`expense_date <= $${expenseParams.length}`);
  }
  const expenseWhereSql = expenseWhere.length ? `WHERE ${expenseWhere.join(' AND ')}` : '';

  const expenseResult = await query(
    `SELECT category, COALESCE(SUM(amount), 0) AS category_total
     FROM expenses
     ${expenseWhereSql}
     GROUP BY category
     ORDER BY category_total DESC`,
    expenseParams
  );

  const expenseTotalResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses ${expenseWhereSql}`,
    expenseParams
  );
  const total_expenses = toNum(expenseTotalResult.rows[0]?.total_expenses);

  const supplierParams = [];
  const supplierWhere = [];
  if (isFilled(filters.from)) {
    supplierParams.push(filters.from);
    supplierWhere.push(`payment_date >= $${supplierParams.length}`);
  }
  if (isFilled(filters.to)) {
    supplierParams.push(filters.to);
    supplierWhere.push(`payment_date <= $${supplierParams.length}`);
  }
  const supplierWhereSql = supplierWhere.length
    ? `WHERE ${supplierWhere.join(' AND ')}`
    : '';
  const supplierTotal = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM supplier_payments ${supplierWhereSql}`,
    supplierParams
  );

  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const found = expenseResult.rows.find((r) => r.category === cat);
    return { category: cat, amount: toNum(found?.category_total) };
  }).filter((r) => r.amount > 0);

  const costByCar = new Map();
  for (const row of cost.data.rows) {
    costByCar.set(row.car_id, (costByCar.get(row.car_id) || 0) + row.total_cost);
  }

  let gross_profit = 0;
  let matched_cars = 0;
  for (const row of collection.data.rows) {
    if (row.car_id == null) continue;
    if (!costByCar.has(row.car_id)) continue;
    gross_profit += row.sale_amount - costByCar.get(row.car_id);
    matched_cars += 1;
  }

  return {
    message: 'Accounting summary retrieved successfully',
    data: {
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        account_type: a.account_type,
        current_balance: Number(a.current_balance || 0),
      })),
      total_balance,
      cost: cost.data.totals,
      collection: collection.data.totals,
      expenses: {
        total_expenses,
        by_category: byCategory,
      },
      supplier_payments: {
        total: toNum(supplierTotal.rows[0]?.total),
      },
      profit: {
        matched_cars,
        gross_profit: round2(gross_profit),
        net_after_expenses: round2(gross_profit - total_expenses),
      },
    },
  };
}

export async function getCarProfit(filters = {}) {
  const cost = await getCostPerCar(filters);
  const collection = await getCollectionPerCar(filters);

  const costByCar = new Map();
  for (const row of cost.data.rows) {
    const prev = costByCar.get(row.car_id) || {
      ...row,
      purchase_cost: 0,
      extra_cost: 0,
      total_cost: 0,
    };
    prev.purchase_cost += row.purchase_cost;
    prev.extra_cost = row.extra_cost; // already de-duped in getCostPerCar for multi rows
    prev.total_cost = round2(prev.purchase_cost + prev.extra_cost);
    costByCar.set(row.car_id, prev);
  }

  const collectionByCar = new Map();
  for (const row of collection.data.rows) {
    if (row.car_id == null) continue;
    collectionByCar.set(row.car_id, row);
  }

  const carIds = new Set([...costByCar.keys(), ...collectionByCar.keys()]);
  const rows = [];

  for (const carId of carIds) {
    const costRow = costByCar.get(carId);
    const collRow = collectionByCar.get(carId);
    const totalCost = costRow?.total_cost || 0;
    const sale = collRow?.sale_amount || 0;
    const collected = collRow?.collected || 0;
    const due = collRow?.due || 0;
    const profit = collRow ? sale - totalCost : null;

    rows.push({
      car_id: carId,
      chassis_no_full: costRow?.chassis_no_full || collRow?.chassis_no_full || null,
      make: costRow?.make || collRow?.make || null,
      model: costRow?.model || collRow?.model || null,
      year: costRow?.year || collRow?.year || null,
      customer_name: collRow?.customer_name || null,
      purchase_cost: costRow?.purchase_cost || 0,
      extra_cost: costRow?.extra_cost || 0,
      total_cost: totalCost,
      sale_amount: sale,
      collected,
      due,
      gross_profit: profit,
      margin_percent: sale > 0 && profit != null ? (profit / sale) * 100 : null,
    });
  }

  rows.sort((a, b) => (b.car_id || 0) - (a.car_id || 0));

  return {
    message: 'Car profit retrieved successfully',
    data: {
      rows,
      totals: {
        count: rows.length,
        purchase_cost: rows.reduce((s, r) => s + r.purchase_cost, 0),
        extra_cost: rows.reduce((s, r) => s + r.extra_cost, 0),
        total_cost: rows.reduce((s, r) => s + r.total_cost, 0),
        sale_amount: rows.reduce((s, r) => s + r.sale_amount, 0),
        collected: rows.reduce((s, r) => s + r.collected, 0),
        due: rows.reduce((s, r) => s + r.due, 0),
        gross_profit: rows.reduce(
          (s, r) => s + (r.gross_profit == null ? 0 : r.gross_profit),
          0
        ),
      },
    },
  };
}

export async function getCustomerLedger(filters = {}) {
  const collection = await getCollectionPerCar(filters);
  const byKey = new Map();

  for (const row of collection.data.rows) {
    const key =
      (row.nid_number && String(row.nid_number).trim()) ||
      (row.contact_number && String(row.contact_number).trim()) ||
      (row.customer_name && String(row.customer_name).trim().toLowerCase()) ||
      (row.showroom_name && String(row.showroom_name).trim().toLowerCase()) ||
      `pay-${row.payment_history_id}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        customer_key: key,
        customer_name: row.customer_name || row.showroom_name || 'Unknown',
        contact_number: row.contact_number,
        nid_number: row.nid_number,
        email: row.email,
        cars: [],
        sale_amount: 0,
        collected: 0,
        due: 0,
      });
    }
    const entry = byKey.get(key);
    entry.cars.push({
      payment_history_id: row.payment_history_id,
      car_id: row.car_id,
      chassis_no_full: row.chassis_no_full,
      make: row.make,
      model: row.model,
      sale_date: row.sale_date,
      sale_amount: row.sale_amount,
      collected: row.collected,
      due: row.due,
      last_payment_date: row.last_payment_date,
    });
    entry.sale_amount += row.sale_amount;
    entry.collected += row.collected;
    entry.due += row.due;
  }

  let rows = [...byKey.values()].sort((a, b) => b.due - a.due);
  if (isFilled(filters.search)) {
    const term = String(filters.search).toLowerCase();
    rows = rows.filter(
      (r) =>
        String(r.customer_name || '').toLowerCase().includes(term) ||
        String(r.contact_number || '').includes(term) ||
        String(r.nid_number || '').includes(term)
    );
  }

  return {
    message: 'Customer ledger retrieved successfully',
    data: {
      rows,
      totals: {
        count: rows.length,
        sale_amount: rows.reduce((s, r) => s + r.sale_amount, 0),
        collected: rows.reduce((s, r) => s + r.collected, 0),
        due: rows.reduce((s, r) => s + r.due, 0),
      },
    },
  };
}

export async function getInventoryValuation() {
  const cost = await getCostPerCar({});
  const unsoldStatuses = new Set([
    'available',
    'pending',
    'reserved',
    'in_transit',
    'preorder',
  ]);

  const byCar = new Map();
  for (const row of cost.data.rows) {
    if (!unsoldStatuses.has(String(row.car_status || '').toLowerCase())) continue;
    const prev = byCar.get(row.car_id) || {
      car_id: row.car_id,
      chassis_no_full: row.chassis_no_full,
      make: row.make,
      model: row.model,
      year: row.year,
      car_status: row.car_status,
      purchase_cost: 0,
      extra_cost: 0,
      total_cost: 0,
    };
    prev.purchase_cost += row.purchase_cost;
    prev.extra_cost = row.extra_cost;
    prev.total_cost = round2(prev.purchase_cost + prev.extra_cost);
    byCar.set(row.car_id, prev);
  }

  // Also include unsold cars that have only extra costs / no purchase yet
  const unsoldCars = await query(
    `SELECT id, make, model, year, chassis_no_full, status
     FROM cars
     WHERE LOWER(COALESCE(status, '')) = ANY($1)`,
    [[...unsoldStatuses]]
  );
  const extraByCar = await getExtraCostsByCar(null);
  for (const car of unsoldCars.rows) {
    const carId = Number(car.id);
    if (byCar.has(carId)) continue;
    const extra = extraByCar.get(carId) || 0;
    if (!extra) continue;
    byCar.set(carId, {
      car_id: carId,
      chassis_no_full: car.chassis_no_full,
      make: car.make,
      model: car.model,
      year: car.year,
      car_status: car.status,
      purchase_cost: 0,
      extra_cost: extra,
      total_cost: extra,
    });
  }

  const rows = [...byCar.values()].sort((a, b) => b.total_cost - a.total_cost);

  return {
    message: 'Inventory valuation retrieved successfully',
    data: {
      rows,
      totals: {
        count: rows.length,
        purchase_cost: round2(rows.reduce((s, r) => s + r.purchase_cost, 0)),
        extra_cost: round2(rows.reduce((s, r) => s + r.extra_cost, 0)),
        total_cost: round2(rows.reduce((s, r) => s + r.total_cost, 0)),
      },
    },
  };
}

export async function getCashBook(filters = {}) {
  const params = [];
  const where = [];

  if (isFilled(filters.bank_account_id)) {
    params.push(toInt(filters.bank_account_id));
    where.push(`bt.bank_account_id = $${params.length}`);
  }
  if (isFilled(filters.from)) {
    params.push(filters.from);
    where.push(`bt.txn_date >= $${params.length}`);
  }
  if (isFilled(filters.to)) {
    params.push(filters.to);
    where.push(`bt.txn_date <= $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT
       bt.id,
       bt.txn_date,
       bt.type,
       bt.amount,
       bt.reference,
       bt.notes,
       bt.source_type,
       bt.source_id,
       bt.bank_account_id,
       ba.name AS account_name,
       ba.account_type
     FROM bank_transactions bt
     INNER JOIN bank_accounts ba ON ba.id = bt.bank_account_id
     ${whereSql}
     ORDER BY bt.txn_date ASC, bt.id ASC`,
    params
  );

  const daily = new Map();
  let total_in = 0;
  let total_out = 0;

  for (const row of result.rows) {
    const day = String(row.txn_date).slice(0, 10);
    if (!daily.has(day)) {
      daily.set(day, { date: day, in: 0, out: 0, entries: [] });
    }
    const bucket = daily.get(day);
    const amount = toNum(row.amount);
    const isIn = row.type === 'in';
    if (isIn) {
      bucket.in += amount;
      total_in += amount;
    } else {
      bucket.out += amount;
      total_out += amount;
    }
    bucket.entries.push({
      id: Number(row.id),
      type: row.type,
      amount,
      reference: row.reference,
      notes: row.notes,
      source_type: row.source_type,
      source_id: row.source_id == null ? null : Number(row.source_id),
      bank_account_id: Number(row.bank_account_id),
      account_name: row.account_name,
      account_type: row.account_type,
    });
  }

  const days = [...daily.values()].map((d) => ({
    ...d,
    in: round2(d.in),
    out: round2(d.out),
    net: round2(d.in - d.out),
  }));

  return {
    message: 'Cash book retrieved successfully',
    data: {
      days,
      totals: {
        total_in: round2(total_in),
        total_out: round2(total_out),
        net: round2(total_in - total_out),
        day_count: days.length,
        entry_count: result.rows.length,
      },
    },
  };
}

export async function getReceivableAging(filters = {}) {
  const collection = await getCollectionPerCar(filters);
  const asOf = isFilled(filters.as_of)
    ? new Date(String(filters.as_of))
    : new Date();

  const buckets = {
    current: { label: '0-30', amount: 0, count: 0, rows: [] },
    days_31_60: { label: '31-60', amount: 0, count: 0, rows: [] },
    days_61_plus: { label: '61+', amount: 0, count: 0, rows: [] },
  };

  for (const row of collection.data.rows) {
    if (!row.due || row.due <= 0) continue;
    const baseDate = row.last_payment_date || row.sale_date;
    const start = baseDate ? new Date(baseDate) : asOf;
    const days = Math.max(
      0,
      Math.floor((asOf.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    let key = 'current';
    if (days > 60) key = 'days_61_plus';
    else if (days > 30) key = 'days_31_60';

    const item = {
      ...row,
      days_overdue: days,
      aging_bucket: buckets[key].label,
    };
    buckets[key].amount += row.due;
    buckets[key].count += 1;
    buckets[key].rows.push(item);
  }

  for (const key of Object.keys(buckets)) {
    buckets[key].amount = round2(buckets[key].amount);
  }

  return {
    message: 'Receivable aging retrieved successfully',
    data: {
      as_of: asOf.toISOString().slice(0, 10),
      buckets,
      totals: {
        due: round2(
          buckets.current.amount +
            buckets.days_31_60.amount +
            buckets.days_61_plus.amount
        ),
        count:
          buckets.current.count +
          buckets.days_31_60.count +
          buckets.days_61_plus.count,
      },
    },
  };
}

export default {
  landedCostFromPurchase,
  getCostPerCar,
  setLcAllocations,
  getCollectionPerCar,
  getSummary,
  getCarProfit,
  getCustomerLedger,
  getInventoryValuation,
  getCashBook,
  getReceivableAging,
};
