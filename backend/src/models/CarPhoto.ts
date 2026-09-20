import type { PoolClient } from 'pg';
import Model from '../lib/Model.js';
import { query } from '../db/pool.js';
import config from '../config/index.js';

export class CarPhoto extends Model {
  static table = 'car_photos';
  static fillable = ['car_id', 'url', 'is_primary', 'sort_order', 'is_hidden'];
  static casts = {
    id: 'integer',
    car_id: 'integer',
    is_primary: 'boolean',
    is_hidden: 'boolean',
    sort_order: 'integer',
  };

  declare id: number;
  declare car_id: number;
  declare url?: string;
  declare is_primary?: boolean;
  declare sort_order?: number;
  declare is_hidden?: boolean;

  /** Resolve folder path (e.g. car_image/foo.jpg) to a public URL. */
  get public_url(): string | null {
    if (!this.url) return null;
    if (/^https?:\/\//i.test(String(this.url))) return String(this.url);
    const clean = String(this.url).replace(/^\/+/, '').replace(/^storage\//, '');
    return `${config.app.url}/${clean}`;
  }

  toJSON(): Record<string, unknown> {
    const base = super.toJSON();
    return { ...base, url: this.public_url };
  }

  static async create(data: Record<string, unknown>, client: PoolClient | null = null): Promise<CarPhoto> {
    const photo = await super.create(data, client) as CarPhoto;
    if (photo.is_primary) {
      await query(
        `UPDATE car_photos SET is_primary = FALSE WHERE car_id = $1 AND id != $2`,
        [photo.car_id, photo.id],
        client
      );
    }
    return photo;
  }
}

export default CarPhoto;
