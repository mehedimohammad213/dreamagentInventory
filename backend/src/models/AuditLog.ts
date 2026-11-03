import Model from '../lib/Model.js';

export class AuditLog extends Model {
  static table = 'audit_logs';
  static timestamps = false;
  static fillable = [
    'user_id',
    'action',
    'entity_type',
    'entity_id',
    'summary',
    'before_data',
    'after_data',
    'ip_address',
    'created_at',
  ];
  static casts = {
    id: 'integer',
    user_id: 'integer',
    entity_id: 'integer',
    before_data: 'json',
    after_data: 'json',
  };

  declare id: number;
  declare user_id?: number | null;
  declare action: string;
  declare entity_type: string;
  declare entity_id?: number | null;
  declare summary?: string | null;
  declare before_data?: unknown;
  declare after_data?: unknown;
  declare ip_address?: string | null;
  declare created_at?: string | Date;
}

export default AuditLog;
