// @ts-nocheck
import * as XLSX from 'xlsx';
import { query } from '../db/pool.js';
import Car from '../models/Car.js';

function cleanNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? null : n;
}

async function resolveCategoryId(name) {
  if (!name) return null;
  const result = await query(
    `SELECT id FROM categories WHERE name ILIKE $1 LIMIT 1`,
    [`%${String(name).trim()}%`]
  );
  return result.rows[0]?.id || null;
}

/**
 * Import cars from Excel/CSV buffer (Laravel CarsImport parity).
 * Required headings: category, make, model, year
 */
export async function importCarsFromExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

  let processed = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const categoryName = row.category || row.Category;
      const make = row.make || row.Make;
      const model = row.model || row.Model;
      const year = cleanNumber(row.year || row.Year);

      if (!categoryName || !make || !model || !year) {
        errors.push({ row: i + 2, message: 'Missing required fields (category, make, model, year)' });
        continue;
      }

      const categoryId = await resolveCategoryId(categoryName);

      await Car.create({
        category_id: categoryId,
        make: String(make).trim(),
        model: String(model).trim(),
        year,
        model_code: row.model_code || row.modelCode || null,
        variant: row.variant || null,
        mileage_km: cleanNumber(row.mileage_km || row.mileage),
        engine_cc: cleanNumber(row.engine_cc || row.engine),
        transmission: row.transmission || null,
        drive: row.drive || null,
        steering: row.steering || null,
        fuel: row.fuel || null,
        color: row.color || null,
        seats: cleanNumber(row.seats),
        grade_overall: row.grade_overall || row.grade || null,
        price_amount: cleanNumber(row.price_amount || row.price),
        price_currency: row.price_currency || 'USD',
        chassis_no_full: row.chassis_no_full || row.chassis || null,
        location: row.location || null,
        country_origin: row.country_origin || row.country || null,
        status: row.status || 'available',
        notes: row.notes || null,
      });
      processed += 1;
    } catch (err) {
      errors.push({ row: i + 2, message: err.message });
    }
  }

  return { processed, errors, total_rows: rows.length };
}

export default { importCarsFromExcel };
