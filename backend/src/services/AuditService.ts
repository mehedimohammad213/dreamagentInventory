// @ts-nocheck
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { toInt } from '../utils/validate.js';

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

export async function writeAudit({
  userId = null,
  action,
  entityType,
  entityId = null,
  summary = null,
  before = null,
  after = null,
  ip = null,
  client = null,
}) {
  try {
    await AuditLog.create(
      {
        user_id: userId == null ? null : toInt(userId),
        action,
        entity_type: entityType,
        entity_id: entityId == null ? null : toInt(entityId),
        summary,
        before_data: before,
        after_data: after,
        ip_address: ip,
        created_at: new Date(),
      },
      client
    );
  } catch (err) {
    // Never break business flow because audit failed
    console.error('Failed to write audit log', err);
  }
}

export async function listAuditLogs(filters = {}) {
  let qb = AuditLog.query().orderBy('created_at', 'DESC').orderBy('id', 'DESC');

  if (isFilled(filters.entity_type)) qb = qb.where('entity_type', filters.entity_type);
  if (isFilled(filters.action)) qb = qb.where('action', filters.action);
  if (isFilled(filters.user_id)) qb = qb.where('user_id', toInt(filters.user_id));
  if (isFilled(filters.entity_id)) qb = qb.where('entity_id', toInt(filters.entity_id));
  if (isFilled(filters.from)) qb = qb.where('created_at', '>=', filters.from);
  if (isFilled(filters.to)) qb = qb.where('created_at', '<=', `${filters.to} 23:59:59`);

  const perPage = toInt(filters.per_page, 50);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const logs = AuditLog.hydrateMany(rows);

  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
  const usersById = new Map();
  if (userIds.length) {
    const users = await User.query().whereIn('id', userIds).get();
    for (const u of users) {
      usersById.set(Number(u.id), {
        id: Number(u.id),
        name: u.name,
        username: u.username,
        role: u.role,
      });
    }
  }

  const data = logs.map((log) => ({
    ...log.toJSON(),
    user: log.user_id ? usersById.get(Number(log.user_id)) || null : null,
  }));

  return {
    message: 'Audit logs retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    },
  };
}

export default { writeAudit, listAuditLogs };
