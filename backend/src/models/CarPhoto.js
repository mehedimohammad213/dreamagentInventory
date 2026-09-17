import Model from '../lib/Model.js';
import { query } from '../db/pool.js';

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

  static async create(data, client = null) {
    const photo = await super.create(data, client);
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
