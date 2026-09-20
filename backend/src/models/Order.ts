import Model from '../lib/Model.js';
import OrderItem from './OrderItem.js';
import User from './User.js';

export class Order extends Model {
  static table = 'orders';
  static fillable = ['user_id', 'total_amount', 'shipping_address', 'status'];
  static casts = {
    id: 'integer',
    user_id: 'integer',
    total_amount: 'number',
  };

  declare id: number;
  declare user_id: number;
  declare total_amount?: number;
  declare shipping_address?: string | null;
  declare status?: string;
  declare items?: OrderItem[];
  declare user?: User | null;

  async loadItems(): Promise<this> {
    const rows = await OrderItem.query().where('order_id', this.id).get();
    this.items = OrderItem.hydrateMany(rows);
    for (const item of this.items) {
      await item.loadCar();
    }
    return this;
  }

  async loadUser(): Promise<this> {
    this.user = this.user_id ? await User.find(this.user_id) : null;
    return this;
  }
}

export default Order;
