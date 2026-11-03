import Model from '../lib/Model.js';

export class AccountingPeriod extends Model {
  static table = 'accounting_periods';
  static fillable = [
    'year_month',
    'is_locked',
    'locked_at',
    'locked_by',
    'notes',
  ];
  static casts = {
    id: 'integer',
    is_locked: 'boolean',
    locked_by: 'integer',
  };

  declare id: number;
  declare year_month: string;
  declare is_locked: boolean;
  declare locked_at?: string | Date | null;
  declare locked_by?: number | null;
  declare notes?: string | null;
}

export default AccountingPeriod;
