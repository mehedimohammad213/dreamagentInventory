import fs from 'fs';
import path from 'path';
import PurchaseHistory from '../models/PurchaseHistory.js';
import Car from '../models/Car.js';
import { query, withTransaction } from '../db/pool.js';
import { validate, parseMaybeJson, toInt, toFloat } from '../utils/validate.js';
import { PURCHASE_PDF_FIELDS } from '../middleware/upload.js';
import config from '../config/index.js';
import { ValidationError, NotFoundError, AppError } from '../lib/errors.js';

const PURCHASE_SCALAR_FIELDS = [
  'purchase_date', 'purchase_amount', 'foreign_amount', 'bdt_amount', 'currency_type',
  'govt_duty', 'cnf_amount', 'miscellaneous', 'hs_code', 'price_amount', 'price_basis',
  'fob_value_usd', 'freight_usd', 'bid_price', 'ser_com', 'lc_date', 'lc_number',
  'lc_bank_name', 'lc_bank_branch_name', 'lc_bank_branch_address', 'total_units_per_lc',
];

const NUMERIC_FIELDS = new Set([
  'purchase_amount', 'foreign_amount', 'bdt_amount', 'cnf_amount', 'price_amount',
  'fob_value_usd', 'freight_usd', 'bid_price', 'ser_com',
]);

const SORTABLE_COLUMNS = new Set([
  'id', 'created_at', 'updated_at', 'purchase_date', 'lc_date', 'purchase_amount',
  'foreign_amount', 'bdt_amount', 'lc_number',
]);

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function purchasePdfRelativePath(filename) {
  return `/purchase_history_pdfs/${filename}`;
}

function resolvePdfFullPath(storedPath) {
  if (!storedPath) return null;
  if (/^https?:\/\//i.test(storedPath)) return null;
  const normalized = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath;
  if (normalized.startsWith('purchase_history_pdfs/')) {
    return path.join(config.paths.publicRoot, normalized);
  }
  return path.join(config.paths.purchasePdfs, path.basename(storedPath));
}

function deleteOldPdf(filePath) {
  const fullPath = resolvePdfFullPath(filePath);
  if (fullPath && fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function foreignAmountFromBidAndSer(bid, ser) {
  const hasBid = bid !== null && bid !== undefined && bid !== '';
  const hasSer = ser !== null && ser !== undefined && ser !== '';

  if (!hasBid && !hasSer) return null;

  return (hasBid ? toFloat(bid, 0) : 0) + (hasSer ? toFloat(ser, 0) : 0);
}

function applyComputedForeignAmountToData(data, existing = null) {
  let bid;
  let ser;

  if (!existing) {
    bid = data.bid_price ?? null;
    ser = data.ser_com ?? null;
  } else {
    bid = Object.prototype.hasOwnProperty.call(data, 'bid_price')
      ? data.bid_price
      : existing.bid_price;
    ser = Object.prototype.hasOwnProperty.call(data, 'ser_com')
      ? data.ser_com
      : existing.ser_com;
  }

  data.foreign_amount = foreignAmountFromBidAndSer(bid, ser);
}

function pickPurchaseData(source) {
  const out = {};
  for (const key of PURCHASE_SCALAR_FIELDS) {
    if (source[key] === undefined) continue;
    out[key] = NUMERIC_FIELDS.has(key) ? toFloat(source[key], source[key]) : source[key];
  }
  return out;
}

function attachPdfUploads(data, files, { existing = null } = {}) {
  for (const field of PURCHASE_PDF_FIELDS) {
    const uploaded = files?.[field]?.[0];
    if (!uploaded) continue;
    if (existing?.[field]) deleteOldPdf(existing[field]);
    data[field] = purchasePdfRelativePath(uploaded.filename);
  }
}

async function hydratePurchaseHistory(record, { includeCars = true } = {}) {
  if (includeCars) {
    await record.loadCars();
    record.car = record.cars?.[0] || null;
  }
  return record;
}

async function hydrateManyPurchaseHistories(records, options = {}) {
  for (const record of records) {
    await hydratePurchaseHistory(record, options);
  }
  return records;
}

function parseCarIds(raw) {
  if (raw == null || raw === '') return null;
  const parsed = Array.isArray(raw) ? raw : parseMaybeJson(raw, null);
  if (!Array.isArray(parsed)) return null;
  return parsed.map((id) => toInt(id)).filter((id) => id != null);
}

async function validateCarIds(carIds) {
  if (!carIds?.length) return { ok: true, errors: {} };

  const errors = {};
  for (let i = 0; i < carIds.length; i += 1) {
    const car = await Car.find(carIds[i]);
    if (!car) {
      errors[`car_ids.${i}`] = ['The selected car id is invalid.'];
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

function validatePurchasePayload(body) {
  const { ok, errors } = validate(body, {
    car_ids: 'nullable|string',
    purchase_date: 'nullable|string',
    purchase_amount: 'nullable|numeric',
    foreign_amount: 'nullable|numeric',
    bdt_amount: 'nullable|numeric',
    currency_type: 'nullable|string|in:dollar,yen',
    govt_duty: 'nullable|string',
    cnf_amount: 'nullable|numeric',
    miscellaneous: 'nullable|string',
    hs_code: 'nullable|string|max:64',
    price_amount: 'nullable|numeric',
    price_basis: 'nullable|string|max:64',
    fob_value_usd: 'nullable|numeric',
    freight_usd: 'nullable|numeric',
    bid_price: 'nullable|numeric',
    ser_com: 'nullable|numeric',
    lc_date: 'nullable|string',
    lc_number: 'nullable|string',
    lc_bank_name: 'nullable|string',
    lc_bank_branch_name: 'nullable|string',
    lc_bank_branch_address: 'nullable|string',
    total_units_per_lc: 'nullable|string',
  });

  return { ok, errors };
}

function applyPurchaseFilters(qb, filters) {
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('lc_number', term)
        .orWhere('invoice_number', 'ILIKE', term)
        .orWhere('lc_bank_name', 'ILIKE', term);
    });
  }

  if (isFilled(filters.purchase_date_from)) {
    qb.where('purchase_date', '>=', filters.purchase_date_from);
  }
  if (isFilled(filters.purchase_date_to)) {
    qb.where('purchase_date', '<=', filters.purchase_date_to);
  }
  if (isFilled(filters.month)) {
    qb.whereRaw('EXTRACT(MONTH FROM "purchase_date") = ?', [toInt(filters.month)]);
  }
  if (isFilled(filters.year)) {
    qb.whereRaw('EXTRACT(YEAR FROM "purchase_date") = ?', [toInt(filters.year)]);
  }
  if (isFilled(filters.lc_month)) {
    qb.whereRaw('EXTRACT(MONTH FROM "lc_date") = ?', [toInt(filters.lc_month)]);
  }
  if (isFilled(filters.lc_year)) {
    qb.whereRaw('EXTRACT(YEAR FROM "lc_date") = ?', [toInt(filters.lc_year)]);
  }

  return qb;
}

export async function listPurchaseHistories(filters) {
  let qb = applyPurchaseFilters(PurchaseHistory.query(), filters);

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
  const purchaseHistories = PurchaseHistory.hydrateMany(rows);
  await hydrateManyPurchaseHistories(purchaseHistories);

  return {
    message: 'Purchase histories retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: purchaseHistories,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    },
  };
}

export async function createPurchaseHistory(body, files) {
  const { ok, errors } = validatePurchasePayload(body);
  if (!ok) throw new ValidationError(errors, 'Validation error');

  const carIds = parseCarIds(body.car_ids);
  if (carIds) {
    const carCheck = await validateCarIds(carIds);
    if (!carCheck.ok) throw new ValidationError(carCheck.errors, 'Validation error');
  }

  const data = pickPurchaseData(body);
  attachPdfUploads(data, files);
  applyComputedForeignAmountToData(data);

  const purchaseHistory = await withTransaction(async (client) => {
    const created = await PurchaseHistory.create(data, client);
    if (isFilled(body.car_ids)) {
      const ids = carIds || [];
      await created.syncCars(ids, client);
    }
    return created;
  });

  await hydratePurchaseHistory(purchaseHistory);
  return {
    status: 201,
    message: 'Purchase history created successfully',
    data: purchaseHistory,
  };
}

export async function getPurchaseHistory(id) {
  const purchaseHistory = await PurchaseHistory.find(id);
  if (!purchaseHistory) {
    throw new NotFoundError('Purchase history not found');
  }

  await hydratePurchaseHistory(purchaseHistory);
  return {
    message: 'Purchase history retrieved successfully',
    data: purchaseHistory,
  };
}

export async function updatePurchaseHistory(id, body, files) {
  const purchaseHistory = await PurchaseHistory.find(id);
  if (!purchaseHistory) {
    throw new NotFoundError('Purchase history not found');
  }

  const { ok, errors } = validatePurchasePayload(body);
  if (!ok) throw new ValidationError(errors, 'Validation error');

  if (Object.prototype.hasOwnProperty.call(body, 'car_ids')) {
    const carIds = parseCarIds(body.car_ids) || [];
    const carCheck = await validateCarIds(carIds);
    if (!carCheck.ok) throw new ValidationError(carCheck.errors, 'Validation error');
  }

  const data = pickPurchaseData(body);
  attachPdfUploads(data, files, { existing: purchaseHistory });
  applyComputedForeignAmountToData(data, purchaseHistory);

  await withTransaction(async (client) => {
    await purchaseHistory.update(data, client);

    if (Object.prototype.hasOwnProperty.call(body, 'car_ids')) {
      const carIds = parseCarIds(body.car_ids) || [];
      await purchaseHistory.syncCars(carIds, client);
    }
  });

  const fresh = await PurchaseHistory.find(purchaseHistory.id);
  await hydratePurchaseHistory(fresh);
  return {
    message: 'Purchase history updated successfully',
    data: fresh,
  };
}

export async function downloadPdf(id, field) {
  const purchaseHistory = await PurchaseHistory.find(id);
  if (!purchaseHistory) {
    throw new NotFoundError('Purchase history not found');
  }

  if (!field) {
    throw new AppError('PDF field name is required', 400);
  }

  if (!PURCHASE_PDF_FIELDS.includes(field)) {
    throw new AppError('Invalid PDF field name', 400);
  }

  const filePath = purchaseHistory[field];
  if (!filePath) {
    throw new NotFoundError('PDF file not found for this field');
  }

  if (/^https?:\/\//i.test(filePath)) {
    return {
      type: 'redirect',
      url: filePath,
    };
  }

  const fullPath = resolvePdfFullPath(filePath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    throw new NotFoundError('PDF file does not exist on server');
  }

  return {
    type: 'download',
    path: fullPath,
    filename: path.basename(filePath),
    contentType: 'application/pdf',
  };
}

export async function deletePurchaseHistory(id) {
  const purchaseHistory = await PurchaseHistory.find(id);
  if (!purchaseHistory) {
    throw new NotFoundError('Purchase history not found');
  }

  for (const field of PURCHASE_PDF_FIELDS) {
    deleteOldPdf(purchaseHistory[field]);
  }

  await withTransaction(async (client) => {
    await query(
      'DELETE FROM car_purchase_history WHERE purchase_history_id = $1',
      [purchaseHistory.id],
      client
    );
    await purchaseHistory.delete(client);
  });

  return {
    message: 'Purchase history deleted successfully',
    data: null,
  };
}

export default {
  listPurchaseHistories,
  createPurchaseHistory,
  getPurchaseHistory,
  updatePurchaseHistory,
  downloadPdf,
  deletePurchaseHistory,
};
