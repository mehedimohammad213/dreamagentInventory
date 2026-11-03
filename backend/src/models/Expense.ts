import Model from '../lib/Model.js';
import BankAccount from './BankAccount.js';

export class Expense extends Model {
  static table = 'expenses';
  static fillable = [
    'expense_date',
    'category',
    'amount',
    'description',
    'bank_account_id',
    'payment_method',
    'reference',
  ];
  static casts = {
    id: 'integer',
    amount: 'number',
    bank_account_id: 'integer',
  };

  declare id: number;
  declare expense_date: string | Date;
  declare category: string;
  declare amount: number;
  declare description?: string | null;
  declare bank_account_id: number;
  declare payment_method?: string | null;
  declare reference?: string | null;
  declare bank_account?: BankAccount | null;

  async loadRelations(): Promise<this> {
    this.bank_account = this.bank_account_id
      ? await BankAccount.find(this.bank_account_id)
      : null;
    return this;
  }
}

export default Expense;
