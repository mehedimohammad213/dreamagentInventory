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

  declare id: number;
  declare order_id: number;
  declare car_id: number;
  declare quantity?: number;
  declare price?: number;
  declare notes?: string | null;
  declare car?: Car | null;

  async loadCar(): Promise<this> {
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    return this;
  }
}

export default OrderItem;
