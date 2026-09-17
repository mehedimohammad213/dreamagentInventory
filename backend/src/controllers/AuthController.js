import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as AuthService from '../services/AuthService.js';

export async function login(req, res) {
  try {
    const result = await AuthService.login(req.body);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Login failed');
  }
}

export async function logout(req, res) {
  try {
    const result = await AuthService.logout(req.accessToken);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Logout failed');
  }
}

export async function user(req, res) {
  try {
    const result = await AuthService.getAuthUser(req.user);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to get user info');
  }
}

export async function currentUser(req, res) {
  try {
    return res.json(AuthService.getCurrentUserJson(req.user));
  } catch (err) {
    return handleControllerError(res, err, 'Failed to get user');
  }
}

export default { login, logout, user, currentUser };
