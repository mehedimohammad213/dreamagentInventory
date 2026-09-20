// @ts-nocheck
import type { Request, Response } from 'express';
import {
  AppError,
  ValidationError,
  NotFoundError,
} from '../lib/errors.js';
import * as CategoryService from '../services/CategoryService.js';

function handleCategoryError(res: Response, err: unknown, fallback: string): Response {
  if (err instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      message: err.message,
      status_code: 422,
      data: { errors: err.extra.errors },
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message,
      status_code: 404,
      data: [],
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      status_code: err.status,
      data: [],
    });
  }

  const message = err instanceof Error ? err.message : String(err);
  return res.status(500).json({
    success: false,
    message: `${fallback}: ${message}`,
    status_code: 500,
    data: [],
  });
}

function sendCategoryResult(
  res: Response,
  result: { httpStatus: number; responseBody: unknown }
): Response {
  return res.status(result.httpStatus).json(result.responseBody);
}

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.index(req.query as Record<string, unknown>);
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to retrieve categories');
  }
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.store(req.body, req.file);
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to create category');
  }
}

export async function show(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.show(req.params.id);
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to retrieve category');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.update(req.params.id, req.body, req.file);
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to update category');
  }
}

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.destroy(req.params.id);
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to delete category');
  }
}

export async function getParentCategories(_req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.getParentCategories();
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to retrieve parent categories');
  }
}

export async function getStats(_req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CategoryService.getStats();
    return sendCategoryResult(res, result);
  } catch (err) {
    return handleCategoryError(res, err, 'Failed to retrieve category statistics');
  }
}

export default {
  index, store, show, update, destroy, getParentCategories, getStats,
};
