import Model from '../lib/Model.js';

export class Installment extends Model {
  static table = 'installments';
  static fillable = [
    'payment_history_id', 'installment_date', 'description', 'amount',
    'payment_method', 'bank_name', 'cheque_number', 'balance', 'remarks', 'status',
  ];
  static casts = {
    id: 'integer',
    payment_history_id: 'integer',
    amount: 'number',
    balance: 'number',
  };
}

export default Installment;
