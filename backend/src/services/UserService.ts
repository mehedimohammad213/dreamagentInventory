// @ts-nocheck
import User from '../models/User.js';
import { validate } from '../utils/validate.js';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from '../lib/errors.js';

function assertAdmin(actor) {
  if (!actor || actor.role !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }
}

function userPayload(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    created_at: user.created_at
      ? new Date(user.created_at).toISOString()
      : null,
  };
}

export async function listUsers(actor, query = {}) {
  assertAdmin(actor);

  const perPage = Math.min(Math.max(Number(query.per_page || 10), 1), 100);
  const page = Math.max(Number(query.page || 1), 1);
  const search = String(query.search || '');

  let qb = User.query()
    .select('id', 'name', 'username', 'email', 'role', 'created_at')
    .where('id', '!=', actor.id);

  if (search) {
    qb = qb.whereGroup((q) => {
      q.whereLike('name', `%${search}%`)
        .orWhere('username', 'ILIKE', `%${search}%`)
        .orWhere('email', 'ILIKE', `%${search}%`);
    });
  }

  const result = await qb.orderBy('created_at', 'DESC').paginate(page, perPage);

  return {
    data: {
      users: User.hydrateMany(result.data).map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
      })),
      pagination: result.pagination,
    },
  };
}

export async function createUser(actor, body) {
  assertAdmin(actor);

  const { ok, errors } = validate(body, {
    name: 'required|string|max:255',
    username: 'required|string|max:255',
    email: 'required|string|email|max:255',
    password: 'required|string|min:8',
    role: 'required|in:admin,user',
  });
  if (!ok) throw new ValidationError(errors);

  if (await User.query().where('username', body.username).first()) {
    throw new ValidationError({ username: ['The username has already been taken.'] });
  }
  if (await User.query().where('email', body.email).first()) {
    throw new ValidationError({ email: ['The email has already been taken.'] });
  }

  const user = await User.create({
    name: body.name,
    username: body.username,
    email: body.email,
    password: body.password,
    role: body.role,
  });

  return {
    status: 201,
    message: 'User created successfully',
    data: { user: userPayload(user) },
  };
}

export async function getUser(actor, userId) {
  assertAdmin(actor);
  try {
    const user = await User.findOrFail(userId);
    return { data: { user: userPayload(user) } };
  } catch (err) {
    if (err.status === 404) throw new NotFoundError('User not found');
    throw err;
  }
}

export async function updateUser(actor, userId, body) {
  assertAdmin(actor);

  const { ok, errors } = validate(body, {
    name: 'required|string|max:255',
    username: 'required|string|max:255',
    email: 'required|string|email|max:255',
    password: 'nullable|string|min:8',
    role: 'required|in:admin,user',
  });
  if (!ok) throw new ValidationError(errors);

  let user;
  try {
    user = await User.findOrFail(userId);
  } catch (err) {
    if (err.status === 404) throw new NotFoundError('User not found');
    throw err;
  }

  if (await User.query().where('username', body.username).where('id', '!=', user.id).first()) {
    throw new ValidationError({ username: ['The username has already been taken.'] });
  }
  if (await User.query().where('email', body.email).where('id', '!=', user.id).first()) {
    throw new ValidationError({ email: ['The email has already been taken.'] });
  }

  if (user.role === 'admin' && body.role === 'user') {
    const adminCount = await User.query().where('role', 'admin').count();
    if (adminCount <= 1) {
      throw new AppError('Cannot demote the only administrator.', 422);
    }
  }

  user.name = body.name;
  user.username = body.username;
  user.email = body.email;
  user.role = body.role;
  if (body.password) user.password = body.password;
  await user.save();

  return {
    message: 'User updated successfully',
    data: { user: userPayload(user) },
  };
}

export async function deleteUser(actor, userId) {
  assertAdmin(actor);

  let user;
  try {
    user = await User.findOrFail(userId);
  } catch (err) {
    if (err.status === 404) throw new NotFoundError('User not found');
    throw err;
  }

  if (user.id === actor.id) {
    throw new AppError('You cannot delete your own account.', 422);
  }

  if (user.role === 'admin') {
    const adminCount = await User.query().where('role', 'admin').count();
    if (adminCount <= 1) {
      throw new AppError('Cannot delete the only administrator.', 422);
    }
  }

  await user.delete();
  return { message: 'User deleted successfully', data: null };
}

export default {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
};
