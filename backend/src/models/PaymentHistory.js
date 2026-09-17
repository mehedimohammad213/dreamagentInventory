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

  async loadRelations() {
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
