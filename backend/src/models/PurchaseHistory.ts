import type { PoolClient } from 'pg';
import Model from '../lib/Model.js';
import { query } from '../db/pool.js';
import Car from './Car.js';

export class PurchaseHistory extends Model {
  static table = 'purchase_history';
  static fillable = [
    'purchase_date', 'purchase_amount', 'govt_duty', 'cnf_amount', 'miscellaneous',
    'hs_code', 'price_amount', 'price_basis', 'fob_value_usd', 'freight_usd',
    'bid_price', 'ser_com', 'foreign_amount', 'bdt_amount', 'currency_type',
    'lc_date', 'lc_number', 'lc_bank_name', 'lc_bank_branch_name', 'lc_bank_branch_address',
    'total_units_per_lc', 'bill_of_lading', 'invoice_number', 'export_certificate',
    'export_certificate_translated', 'bill_of_exchange_amount', 'custom_duty_copy_3pages',
    'cheque_copy', 'certificate', 'custom_one', 'custom_two', 'custom_three',
  ];
  static casts = {
    id: 'integer',
    purchase_amount: 'number',
    cnf_amount: 'number',
    price_amount: 'number',
    fob_value_usd: 'number',
    freight_usd: 'number',
    bid_price: 'number',
    ser_com: 'number',
    foreign_amount: 'number',
    bdt_amount: 'number',
  };

  declare id: number;
  declare purchase_date?: string | Date | null;
  declare purchase_amount?: number | null;
  declare cars?: Car[];
  declare car_ids?: number[];

  async loadCars(): Promise<this> {
    const result = await query(
      `SELECT c.* FROM cars c
       INNER JOIN car_purchase_history cph ON cph.car_id = c.id
       WHERE cph.purchase_history_id = $1`,
      [this.id]
    );
    this.cars = Car.hydrateMany(result.rows);
    this.car_ids = this.cars.map((c) => c.id);
    return this;
  }

  async syncCars(carIds: unknown[] | null | undefined, client: PoolClient | null = null): Promise<void> {
    const ids = [...new Set((carIds || []).map(Number).filter(Boolean))];
    await query(
      `DELETE FROM car_purchase_history WHERE purchase_history_id = $1`,
      [this.id],
      client
    );
    for (const carId of ids) {
      await query(
        `INSERT INTO car_purchase_history (car_id, purchase_history_id, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [carId, this.id],
        client
      );
    }
    this.car_ids = ids;
  }
}

export default PurchaseHistory;
