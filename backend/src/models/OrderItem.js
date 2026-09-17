import Model from '../lib/Model.js';
import Car from './Car.js';

export class OrderItem extends Model {
  static table = 'order_items';
  static fillable = ['order_id', 'car_id', 'quantity', 'price', 'notes'];
  static casts = {
    id: 'integer',
    order_id: 'integer',
    car_id: 'integer',
    quantity: 'integer',
    price: 'number',
  };

  async loadCar() {
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    return this;
  }
}

export default OrderItem;
