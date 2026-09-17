import { apiClient } from "./apiClient";

export interface OrderItem {
  id: number;
  order_id: number;
  car_id: number;
  quantity: number;
  price: number;
  notes?: string;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    image_url?: string;
  };
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  shipping_address?: string;
  status: "pending" | "approved" | "shipped" | "delivered" | "canceled";
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateOrderRequest {
  shipping_address?: string;
}

export interface UpdateOrderStatusRequest {
  status: "pending" | "approved" | "shipped" | "delivered" | "canceled";
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class OrderApi {
  // Create order from cart
  async createOrder(
    data: CreateOrderRequest
  ): Promise<ApiResponse<{ order: Order }>> {
    console.log("OrderApi: Creating order with data:", data);
    const response = await apiClient.post("/orders", data);
    console.log("OrderApi: Response received:", response.data);
    return response.data;
  }

  // Get user's orders
  async getUserOrders(): Promise<ApiResponse<{ orders: Order[] }>> {
    const response = await apiClient.get("/orders/user");
    return response.data;
  }

  // Get all orders (Admin only)
  async getAllOrders(): Promise<ApiResponse<{ orders: Order[] }>> {
    const response = await apiClient.get("/orders/admin/all");
    return response.data;
  }

  // Get single order details
  async getOrder(id: number): Promise<ApiResponse<{ order: Order }>> {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  }

  // Update order status (Admin only)
  async updateOrderStatus(
    id: number,
    data: UpdateOrderStatusRequest
  ): Promise<ApiResponse<{ order: Order }>> {
    const response = await apiClient.put(`/orders/${id}/status`, data);
    return response.data;
  }

  // Cancel order (User only)
  async cancelOrder(id: number): Promise<ApiResponse<{ order: Order }>> {
    const response = await apiClient.put(`/orders/${id}/cancel`);
    return response.data;
  }

  // Delete order (Admin only)
  async deleteOrder(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  }
}

export const orderApi = new OrderApi();
