import type { PoolClient } from 'pg';
import Model from '../lib/Model.js';
import CarPhoto from './CarPhoto.js';
import CarDetail from './CarDetail.js';
import Category from './Category.js';

export class Car extends Model {
  static table = 'cars';
  static fillable = [
    'category_id', 'subcategory_id', 'ref_no', 'code', 'make', 'model', 'model_code',
    'variant', 'year', 'reg_year_month', 'mileage_km', 'engine_cc', 'transmission',
    'drive', 'steering', 'fuel', 'color', 'seats', 'grade_overall', 'grade_exterior',
    'grade_interior', 'price_amount', 'price_currency', 'price_basis', 'fob_value_usd',
    'freight_usd', 'chassis_no_masked', 'chassis_no_full', 'location', 'country_origin',
    'status', 'package', 'body', 'type', 'engine_number', 'number_of_keys',
    'keys_feature', 'notes', 'attached_file',
  ];
  static casts = {
    id: 'integer',
    category_id: 'integer',
    subcategory_id: 'integer',
    year: 'integer',
    mileage_km: 'integer',
    engine_cc: 'integer',
    seats: 'integer',
    number_of_keys: 'integer',
    price_amount: 'number',
    fob_value_usd: 'number',
    freight_usd: 'number',
  };

  declare id: number;
  declare category_id?: number | null;
  declare subcategory_id?: number | null;
  declare ref_no?: string;
  declare status?: string;
  declare price_currency?: string;
  declare category?: Category | null;
  declare subcategory?: Category | null;
  declare photos?: CarPhoto[];
  declare primary_photo?: CarPhoto | null;
  declare details?: CarDetail[];
  declare detail?: CarDetail | null;

  static async create(data: Record<string, unknown>, client: PoolClient | null = null): Promise<Car> {
    const payload = { ...data };
    if (!payload.ref_no) {
      payload.ref_no = `CAR-${Date.now().toString(36).toUpperCase()}`;
    }
    if (!payload.price_currency) payload.price_currency = 'USD';
    if (!payload.status) payload.status = 'available';
    return super.create(payload, client) as Promise<Car>;
  }

  async loadRelations({
    photos = true,
    details = true,
    category = true,
  }: { photos?: boolean; details?: boolean; category?: boolean } = {}): Promise<this> {
    if (category) {
      this.category = this.category_id
        ? await Category.find(this.category_id)
        : null;
      this.subcategory = this.subcategory_id
        ? await Category.find(this.subcategory_id)
        : null;
    }
    if (photos) {
      const photoRows = await CarPhoto.query()
        .where('car_id', this.id)
        .orderBy('sort_order', 'ASC')
        .get();
      this.photos = CarPhoto.hydrateMany(photoRows);
      this.primary_photo = this.photos.find((p) => p.is_primary) || this.photos[0] || null;
    }
    if (details) {
      const detailRows = await CarDetail.query().where('car_id', this.id).get();
      this.details = [];
      for (const d of detailRows) {
        const detail = CarDetail.hydrate(d);
        if (detail) {
          await detail.loadSubDetails();
          this.details.push(detail);
        }
      }
      this.detail = this.details[0] || null;
    }
    return this;
  }

  static async withRelations(carId: unknown): Promise<Car> {
    const car = await this.findOrFail(carId);
    await car.loadRelations();
    return car;
  }
}

export default Car;
