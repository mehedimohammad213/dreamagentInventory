import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface CartItem {
  id: number;
  user_id: number;
  car_id: number;
  quantity: number;
  car: {
    id: number;
    make: string;
    model: string;
    variant?: string;
    year: number;
    price_amount: number;
    price_currency: string;
    mileage_km: number;
    transmission: string;
    fuel: string;
    color: string;
    status: string;
    category?: {
      id: number;
      name: string;
    };
    primary_photo?: {
      id: number;
      image_url: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    items: CartItem[];
    total: number;
    count: number;
  };
}

export interface CartSummary {
  success: boolean;
  data: {
    count: number;
    total: number;
    items_count: number;
  };
}

export interface AddToCartRequest {
  car_id: number;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

class CartApiService {
  async getCartItems(): Promise<CartResponse> {
    const response = await apiClient.get(API_ENDPOINTS.CART.BASE);
    return response.data;
  }

  async addToCart(data: AddToCartRequest): Promise<{ success: boolean; data: CartItem; message: string }> {
    const response = await apiClient.post(API_ENDPOINTS.CART.BASE, data);
    return response.data;
  }

  async updateCartItem(cartId: number, data: UpdateCartRequest): Promise<{ success: boolean; data: CartItem; message: string }> {
    const response = await apiClient.put(`${API_ENDPOINTS.CART.BASE}/${cartId}`, data);
    return response.data;
  }

  async removeFromCart(cartId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${API_ENDPOINTS.CART.BASE}/${cartId}`);
    return response.data;
  }

  async clearCart(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
    return response.data;
  }

  async getCartSummary(): Promise<CartSummary> {
    const response = await apiClient.get(API_ENDPOINTS.CART.SUMMARY);
    return response.data;
  }
}

export const cartApi = new CartApiService();
