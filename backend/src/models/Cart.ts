import Model from '../lib/Model.js';
import Car from './Car.js';

export class Cart extends Model {
  static table = 'carts';
  static fillable = ['user_id', 'car_id', 'quantity'];
  static casts = {
    id: 'integer',
    user_id: 'integer',
    car_id: 'integer',
    quantity: 'integer',
  };

  declare id: number;
  declare user_id: number;
  declare car_id: number;
  declare quantity?: number;
  declare car?: Car | null;

  async loadCar(): Promise<this> {
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    if (this.car) {
      await this.car.loadRelations({ details: false, photos: true, category: true });
    }
    return this;
  }
}

export default Cart;
