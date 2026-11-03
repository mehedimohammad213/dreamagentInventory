import Model from '../lib/Model.js';

export class BankAccount extends Model {
  static table = 'bank_accounts';
  static fillable = [
    'name',
    'bank_name',
    'branch_name',
    'account_number',
    'account_type',
    'currency',
    'opening_balance',
    'opening_balance_date',
    'is_active',
    'notes',
  ];
  static casts = {
    id: 'integer',
    opening_balance: 'number',
    is_active: 'boolean',
  };

  declare id: number;
  declare name: string;
  declare bank_name?: string | null;
  declare branch_name?: string | null;
  declare account_number?: string | null;
  declare account_type: 'bank' | 'cash';
  declare currency: string;
  declare opening_balance: number;
  declare opening_balance_date?: string | Date | null;
  declare is_active: boolean;
  declare notes?: string | null;
  declare current_balance?: number;
}

export default BankAccount;
