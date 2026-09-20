import Model from '../lib/Model.js';

export class CarSubDetail extends Model {
  static table = 'car_sub_details';
  static fillable = ['car_detail_id', 'title', 'description'];
  static casts = {
    id: 'integer',
    car_detail_id: 'integer',
  };

  declare id: number;
  declare car_detail_id: number;
  declare title?: string;
  declare description?: string | null;
}

export default CarSubDetail;
