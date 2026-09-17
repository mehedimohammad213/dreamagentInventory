import Model from '../lib/Model.js';
import Car from './Car.js';

export class Stock extends Model {
  static table = 'stocks';
  static fillable = ['car_id', 'quantity', 'price', 'status', 'notes'];
  static casts = {
    id: 'integer',
    car_id: 'integer',
    quantity: 'integer',
    price: 'number',
  };

  async loadCar() {
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    if (this.car) await this.car.loadRelations({ details: false });
    return this;
  }
}

export default Stock;
