// @ts-nocheck
import type { Request, Response } from 'express';
import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as UserService from '../services/UserService.js';

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await UserService.listUsers(req.user!, req.query as Record<string, unknown>);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to get users');
  }
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await UserService.createUser(req.user!, req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create user');
  }
}

export async function show(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await UserService.getUser(req.user!, req.params.user);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to get user');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await UserService.updateUser(req.user!, req.params.user, req.body);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update user');
  }
}

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await UserService.deleteUser(req.user!, req.params.user);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete user');
  }
}

export default { index, store, show, update, destroy };
