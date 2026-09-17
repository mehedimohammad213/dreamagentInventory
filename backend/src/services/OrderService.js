import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Cart from '../models/Cart.js';
import Stock from '../models/Stock.js';
import Car from '../models/Car.js';
import { withTransaction } from '../db/pool.js';
import { validate } from '../utils/validate.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from '../lib/errors.js';

function assertAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access');
  }
}

async function loadOrderFull(order) {
  await order.loadItems();
  await order.loadUser();
  if (order.user) {
    order.user = order.user.toJSON();
  }
  return order;
}

async function reduceStockForOrder(order, client) {
  for (const orderItem of order.items) {
    const row = await Stock.query(client).where('car_id', orderItem.car_id).first();
    if (!row) {
      throw new AppError(`Stock not found for car ID: ${orderItem.car_id}`, 500);
    }
    const stock = Stock.hydrate(row);
    if (stock.quantity < orderItem.quantity) {
      throw new AppError(
        `Insufficient stock for car ID: ${orderItem.car_id}. Available: ${stock.quantity}, Required: ${orderItem.quantity}`,
        500
      );
    }
    const newQuantity = stock.quantity - orderItem.quantity;
    await Stock.query(client).where('id', stock.id).update({
      quantity: newQuantity,
      ...(newQuantity === 0 ? { status: 'sold' } : {}),
      updated_at: new Date(),
    });
    if (newQuantity === 0) {
      await Car.query(client).where('id', orderItem.car_id).update({
        status: 'sold',
        updated_at: new Date(),
      });
    }
  }
}

export async function createOrder(user, body) {
  const { ok, errors } = validate(body, {
    shipping_address: 'nullable|string|max:500',
  });
  if (!ok) throw new ValidationError(errors);

  try {
    const order = await withTransaction(async (client) => {
      const cartRows = await Cart.query(client).where('user_id', user.id).get();
      const cartItems = Cart.hydrateMany(cartRows);

      if (!cartItems.length) {
        throw new AppError('Cart is empty', 400);
      }

      let totalAmount = 0;
      for (const item of cartItems) {
        await item.loadCar();
        if (!item.car?.price_amount) {
          throw new AppError(
            `Car with ID ${item.car_id} does not have a valid price. Cannot create order.`,
            500
          );
        }
        totalAmount += Number(item.car.price_amount) * item.quantity;
      }

      const created = await Order.create({
        user_id: user.id,
        total_amount: totalAmount,
        shipping_address: body.shipping_address || null,
        status: 'pending',
      }, client);

      for (const item of cartItems) {
        await OrderItem.create({
          order_id: created.id,
          car_id: item.car_id,
          quantity: item.quantity,
          price: item.car.price_amount,
          notes: null,
        }, client);
      }

      await Cart.query(client).where('user_id', user.id).delete();
      return created;
    });

    await loadOrderFull(order);
    return {
      status: 201,
      message: 'Order created successfully',
      data: { order },
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to create order: ${err.message}`, 500);
  }
}

export async function getUserOrders(userId) {
  const rows = await Order.query()
    .where('user_id', userId)
    .orderBy('created_at', 'DESC')
    .get();
  const orders = [];
  for (const row of rows) {
    const order = Order.hydrate(row);
    await order.loadItems();
    orders.push(order);
  }
  return { data: { orders } };
}

export async function getAllOrders(actor) {
  assertAdmin(actor);
  const rows = await Order.query().orderBy('created_at', 'DESC').get();
  const orders = [];
  for (const row of rows) {
    const order = Order.hydrate(row);
    await loadOrderFull(order);
    orders.push(order);
  }
  return { data: { orders } };
}

export async function getOrder(actor, orderId) {
  const order = await Order.find(orderId);
  if (!order) throw new NotFoundError('Order not found');

  if (actor.role !== 'admin' && order.user_id !== actor.id) {
    throw new ForbiddenError('Unauthorized access');
  }

  await loadOrderFull(order);
  return { data: { order } };
}

export async function updateOrderStatus(actor, orderId, body) {
  assertAdmin(actor);

  const { ok, errors } = validate(body, {
    status: 'required|in:pending,approved,shipped,delivered,canceled',
  });
  if (!ok) throw new ValidationError(errors);

  const order = await Order.find(orderId);
  if (!order) throw new NotFoundError('Order not found');

  try {
    await withTransaction(async (client) => {
      await order.loadItems();
      if (body.status === 'delivered' && order.status !== 'delivered') {
        await reduceStockForOrder(order, client);
      }
      await Order.query(client).where('id', order.id).update({
        status: body.status,
        updated_at: new Date(),
      });
      order.status = body.status;
    });

    await loadOrderFull(order);
    return {
      message: 'Order status updated successfully',
      data: { order },
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to update order status: ${err.message}`, 500);
  }
}

export async function cancelOrder(user, orderId) {
  const row = await Order.query()
    .where('id', orderId)
    .where('user_id', user.id)
    .first();

  if (!row) throw new NotFoundError('Order not found');
  const order = Order.hydrate(row);

  if (order.status !== 'pending') {
    throw new AppError('Order cannot be canceled. Only pending orders can be canceled.', 400);
  }

  order.status = 'canceled';
  await order.save();
  await order.loadItems();
  return { message: 'Order canceled successfully', data: { order } };
}

export async function deleteOrder(actor, orderId) {
  assertAdmin(actor);
  const order = await Order.find(orderId);
  if (!order) throw new NotFoundError('Order not found');

  await OrderItem.query().where('order_id', order.id).delete();
  await order.delete();
  return { message: 'Order deleted successfully', data: null };
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
