import Model from '../lib/Model.js';

export class CarSubDetail extends Model {
  static table = 'car_sub_details';
  static fillable = ['car_detail_id', 'title', 'description'];
  static casts = {
    id: 'integer',
    car_detail_id: 'integer',
  };
}

export default CarSubDetail;
