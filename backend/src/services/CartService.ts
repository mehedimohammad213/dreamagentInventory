import Cart from '../models/Cart.js';
import Car from '../models/Car.js';
import { validate } from '../utils/validate.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from '../lib/errors.js';

export async function getCart(userId) {
  const rows = await Cart.query().where('user_id', userId).get();
  const items = Cart.hydrateMany(rows);
  let total = 0;
  for (const item of items) {
    await item.loadCar();
    if (item.car?.price_amount) {
      total += Number(item.car.price_amount) * item.quantity;
    }
  }
  return { data: { items, total, count: items.length } };
}

export async function addToCart(userId, body) {
  const { ok, errors } = validate(body, {
    car_id: 'required|integer',
    quantity: 'required|integer|min:1|max:10',
  });
  if (!ok) throw new ValidationError(errors);

  const car = await Car.find(body.car_id);
  if (!car) {
    throw new ValidationError({ car_id: ['The selected car id is invalid.'] });
  }
  if (car.status !== 'available') {
    throw new AppError('This car is not available for purchase', 400);
  }
  if (!car.price_amount || Number(car.price_amount) <= 0) {
    throw new AppError('This car does not have a valid price and cannot be added to cart', 400);
  }

  const existingRow = await Cart.query()
    .where('user_id', userId)
    .where('car_id', body.car_id)
    .first();

  let cartItem;
  if (existingRow) {
    cartItem = Cart.hydrate(existingRow);
    cartItem.quantity += Number(body.quantity);
    await cartItem.save();
  } else {
    cartItem = await Cart.create({
      user_id: userId,
      car_id: Number(body.car_id),
      quantity: Number(body.quantity),
    });
  }

  await cartItem.loadCar();
  return {
    status: 201,
    message: 'Item added to cart successfully',
    data: cartItem,
  };
}

export async function updateCartItem(userId, cartId, body) {
  const { ok, errors } = validate(body, {
    quantity: 'required|integer|min:1|max:10',
  });
  if (!ok) throw new ValidationError(errors);

  const cart = await Cart.find(cartId);
  if (!cart) throw new NotFoundError('Cart item not found');
  if (cart.user_id !== userId) {
    throw new ForbiddenError('Unauthorized access to cart item');
  }

  cart.quantity = Number(body.quantity);
  await cart.save();
  await cart.loadCar();
  return { message: 'Cart item updated successfully', data: cart };
}

export async function removeCartItem(userId, cartId) {
  const cart = await Cart.find(cartId);
  if (!cart) throw new NotFoundError('Cart item not found');
  if (cart.user_id !== userId) {
    throw new ForbiddenError('Unauthorized access to cart item');
  }
  await cart.delete();
  return { message: 'Item removed from cart successfully', data: null };
}

export async function clearCart(userId) {
  await Cart.query().where('user_id', userId).delete();
  return { message: 'Cart cleared successfully', data: null };
}

export async function getCartSummary(userId) {
  const rows = await Cart.query().where('user_id', userId).get();
  const items = Cart.hydrateMany(rows);
  let total = 0;
  let count = 0;
  for (const item of items) {
    await item.loadCar();
    if (item.car?.price_amount) {
      total += Number(item.car.price_amount) * item.quantity;
    }
    count += item.quantity;
  }
  return {
    data: {
      count,
      total,
      items_count: items.length,
    },
  };
}

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartSummary,
};
