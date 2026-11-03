import Model from '../lib/Model.js';
import BankAccount from './BankAccount.js';
import PurchaseHistory from './PurchaseHistory.js';
import Car from './Car.js';

export class SupplierPayment extends Model {
  static table = 'supplier_payments';
  static fillable = [
    'payment_date',
    'category',
    'amount',
    'description',
    'supplier_name',
    'purchase_history_id',
    'car_id',
    'bank_account_id',
    'payment_method',
    'reference',
  ];
  static casts = {
    id: 'integer',
    amount: 'number',
    purchase_history_id: 'integer',
    car_id: 'integer',
    bank_account_id: 'integer',
  };

  declare id: number;
  declare payment_date: string | Date;
  declare category: string;
  declare amount: number;
  declare description?: string | null;
  declare supplier_name?: string | null;
  declare purchase_history_id?: number | null;
  declare car_id?: number | null;
  declare bank_account_id: number;
  declare payment_method?: string | null;
  declare reference?: string | null;
  declare bank_account?: BankAccount | null;
  declare purchase_history?: PurchaseHistory | null;
  declare car?: Car | null;

  async loadRelations(): Promise<this> {
    this.bank_account = this.bank_account_id
      ? await BankAccount.find(this.bank_account_id)
      : null;
    this.purchase_history = this.purchase_history_id
      ? await PurchaseHistory.find(this.purchase_history_id)
      : null;
    this.car = this.car_id ? await Car.find(this.car_id) : null;
    return this;
  }
}

export default SupplierPayment;
