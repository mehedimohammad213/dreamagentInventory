import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as OrderService from '../services/OrderService.js';

export async function createOrder(req, res) {
  try {
    const result = await OrderService.createOrder(req.user, req.body);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create order');
  }
}

export async function getUserOrders(req, res) {
  try {
    const result = await OrderService.getUserOrders(req.user.id);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to fetch orders');
  }
}

export async function getAllOrders(req, res) {
  try {
    const result = await OrderService.getAllOrders(req.user);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to fetch orders');
  }
}

export async function getOrder(req, res) {
  try {
    const result = await OrderService.getOrder(req.user, req.params.id);
    return success(res, result.data);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to fetch order');
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const result = await OrderService.updateOrderStatus(req.user, req.params.id, req.body);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update order status');
  }
}

export async function cancelOrder(req, res) {
  try {
    const result = await OrderService.cancelOrder(req.user, req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to cancel order');
  }
}

export async function deleteOrder(req, res) {
  try {
    const result = await OrderService.deleteOrder(req.user, req.params.id);
    return success(res, result.data, result.message);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete order');
  }
}

export default {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
};
