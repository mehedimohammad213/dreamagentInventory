// @ts-nocheck
import type { Request, Response } from 'express';
import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as CartService from '../services/CartService.js';

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.getCart(req.user!.id);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to fetch cart items');
  }
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.addToCart(req.user!.id, req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to add item to cart');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.updateCartItem(req.user!.id, req.params.cart, req.body);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update cart item');
  }
}

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.removeCartItem(req.user!.id, req.params.cart);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to remove item from cart');
  }
}

export async function clear(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.clearCart(req.user!.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to clear cart');
  }
}

export async function summary(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CartService.getCartSummary(req.user!.id);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to get cart summary');
  }
}

export default { index, store, update, destroy, clear, summary };
