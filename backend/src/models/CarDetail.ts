import Model from '../lib/Model.js';
import CarSubDetail from './CarSubDetail.js';

export class CarDetail extends Model {
  static table = 'car_details';
  static fillable = ['car_id', 'short_title', 'full_title', 'description', 'images'];
  static casts = {
    id: 'integer',
    car_id: 'integer',
    images: 'array',
  };

  declare id: number;
  declare car_id: number;
  declare short_title?: string | null;
  declare full_title?: string | null;
  declare description?: string | null;
  declare images?: unknown;
  declare sub_details?: CarSubDetail[];

  async loadSubDetails(): Promise<this> {
    const rows = await CarSubDetail.query()
      .where('car_detail_id', this.id)
      .get();
    this.sub_details = CarSubDetail.hydrateMany(rows);
    return this;
  }

  toJSON(): Record<string, unknown> {
    const base = super.toJSON();
    if (typeof base.images === 'string') {
      try {
        base.images = JSON.parse(base.images);
      } catch {
        /* keep */
      }
    }
    return base;
  }
}

export default CarDetail;
