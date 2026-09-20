import Model from '../lib/Model.js';
import Installment from './Installment.js';
import Car from './Car.js';

export class PaymentHistory extends Model {
  static table = 'payment_history';
  static fillable = [
    'car_id', 'showroom_name', 'wholesaler_address', 'purchase_amount', 'purchase_date',
    'customer_name', 'nid_number', 'tin_certificate', 'customer_address',
    'contact_number', 'email',
  ];
  static casts = {
    id: 'integer',
    car_id: 'integer',
    purchase_amount: 'number',
  };

  declare id: number;
  declare car_id?: number | null;
  declare showroom_name?: string | null;
  declare wholesaler_address?: string | null;
  declare purchase_amount?: number | null;
  declare purchase_date?: string | Date | null;
  declare customer_name?: string | null;
  declare nid_number?: string | null;
  declare tin_certificate?: string | null;
  declare customer_address?: string | null;
  declare contact_number?: string | null;
  declare email?: string | null;
  declare car?: Car | null;
  declare installments?: Installment[];

  async loadRelations(): Promise<this> {
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    const rows = await Installment.query()
      .where('payment_history_id', this.id)
      .orderBy('installment_date', 'ASC')
      .get();
    this.installments = Installment.hydrateMany(rows);
    return this;
  }
}

export default PaymentHistory;
