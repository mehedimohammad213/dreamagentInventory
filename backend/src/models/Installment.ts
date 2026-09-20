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

  declare id: number;
  declare payment_history_id: number;
  declare installment_date?: string | Date;
  declare description?: string | null;
  declare amount?: number;
  declare payment_method?: string | null;
  declare bank_name?: string | null;
  declare cheque_number?: string | null;
  declare balance?: number | null;
  declare remarks?: string | null;
  declare status?: string | null;
}

export default Installment;
