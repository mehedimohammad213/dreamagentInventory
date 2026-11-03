import Model from '../lib/Model.js';
import BankAccount from './BankAccount.js';

export class CarExtraCost extends Model {
  static table = 'car_extra_costs';
  static fillable = [
    'car_id',
    'cost_date',
    'category',
    'amount',
    'description',
    'bank_account_id',
    'payment_method',
  ];
  static casts = {
    id: 'integer',
    car_id: 'integer',
    amount: 'number',
    bank_account_id: 'integer',
  };

  declare id: number;
  declare car_id: number;
  declare cost_date: string | Date;
  declare category: string;
  declare amount: number;
  declare description?: string | null;
  declare bank_account_id?: number | null;
  declare payment_method?: string | null;
  declare bank_account?: BankAccount | null;

  async loadRelations(): Promise<this> {
    this.bank_account = this.bank_account_id
      ? await BankAccount.find(this.bank_account_id)
      : null;
    return this;
  }
}

export default CarExtraCost;
