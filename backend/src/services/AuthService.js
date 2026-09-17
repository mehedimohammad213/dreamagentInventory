import User from '../models/User.js';
import { deleteToken } from '../lib/tokens.js';
import { validate } from '../utils/validate.js';
import { ValidationError, UnauthorizedError, AppError } from '../lib/errors.js';

function authUserPayload(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  };
}

export async function login(body) {
  const { ok, errors } = validate(body, {
    username: 'required|string',
    password: 'required|string',
  });
  if (!ok) throw new ValidationError(errors);

  const row = await User.query().where('username', body.username).first();
  const user = row ? User.hydrate(row) : null;

  if (!user || !(await user.verifyPassword(body.password))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = await user.createAccessToken('auth-token');

  return {
    message: 'Login successful',
    data: {
      user: authUserPayload(user),
      token: token.plainTextToken,
      token_type: 'Bearer',
    },
  };
}

export async function logout(accessToken) {
  if (accessToken?.id) {
    await deleteToken(accessToken.id);
  }
  return { message: 'Logout successful', data: null };
}

export async function getAuthUser(user) {
  if (!user) throw new UnauthorizedError('User not authenticated');
  return {
    data: { user: authUserPayload(user) },
  };
}

export function getCurrentUserJson(user) {
  if (!user) throw new UnauthorizedError('User not authenticated');
  return user.toJSON();
}

export default { login, logout, getAuthUser, getCurrentUserJson };
