import Model from '../lib/Model.js';

export class BankTransaction extends Model {
  static table = 'bank_transactions';
  static fillable = [
    'bank_account_id',
    'txn_date',
    'type',
    'amount',
    'reference',
    'notes',
    'source_type',
    'source_id',
    'related_account_id',
  ];
  static casts = {
    id: 'integer',
    bank_account_id: 'integer',
    amount: 'number',
    source_id: 'integer',
    related_account_id: 'integer',
  };

  declare id: number;
  declare bank_account_id: number;
  declare txn_date: string | Date;
  declare type: 'in' | 'out' | 'transfer';
  declare amount: number;
  declare reference?: string | null;
  declare notes?: string | null;
  declare source_type?: string | null;
  declare source_id?: number | null;
  declare related_account_id?: number | null;
}

export default BankTransaction;
