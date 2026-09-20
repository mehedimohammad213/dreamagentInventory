import { apiClient } from "./apiClient";

export interface Installment {
  id: number;
  payment_history_id: number;
  installment_date: string | null;
  description: string | null;
  amount: number | null;
  payment_method: "Bank" | "Cash" | null;
  bank_name: string | null;
  cheque_number: string | null;
  balance: number | null;
  remarks: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: number;
  make: string;
  model: string;
  ref_no?: string;
  year?: number;
  package?: string;
  fuel?: string;
  color?: string;
  transmission?: string;
  seats?: number;
  chassis_no_full?: string;
  chassis_no_masked?: string;
  engine_cc?: number;
  drive?: string;
  mileage_km?: number;
}

export interface PaymentHistory {
  id: number;
  car_id: number | null;
  showroom_name: string | null;
  wholesaler_address: string | null;
  purchase_amount: number | null;
  purchase_date: string | null;
  nid_number: string | null;
  customer_name: string | null;
  tin_certificate: string | null;
  customer_address: string | null;
  contact_number: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;

  // Relationships
  car?: Car;
  installments?: Installment[];
}

export interface CreateInstallmentData {
  installment_date?: string | null;
  description?: string | null;
  amount?: number | null;
  payment_method?: "Bank" | "Cash" | null;
  bank_name?: string | null;
  cheque_number?: string | null;
  balance?: number | null;
  remarks?: string | null;
  status?: string | null;
}

export interface UpdateInstallmentData extends CreateInstallmentData {
  id?: number;
}

export interface CreatePaymentHistoryData {
  car_id?: number | null;
  showroom_name?: string | null;
  wholesaler_address?: string | null;
  purchase_amount?: number | null;
  purchase_date?: string | null;
  nid_number?: string | null;
  customer_name?: string | null;
  tin_certificate?: string | null;
  customer_address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  installments?: CreateInstallmentData[];
}

export interface UpdatePaymentHistoryData extends CreatePaymentHistoryData {
  installments?: UpdateInstallmentData[];
}

export interface PaymentHistoryListResponse {
  data: PaymentHistory[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class PaymentHistoryApi {
  // Get all payment histories
  async getPaymentHistories(params?: {
    search?: string;
    car_id?: number;
    purchase_date_from?: string;
    purchase_date_to?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  }): Promise<PaymentHistoryListResponse> {
    const response = await apiClient.get("/payment-history", { params });
    const paginator = response.data.data || response.data;
    return {
      data: paginator.data || [],
      current_page: paginator.current_page || 1,
      last_page: paginator.last_page || 1,
      per_page: paginator.per_page || 15,
      total: paginator.total || 0,
    };
  }

  // Get single payment history
  async getPaymentHistory(
    id: number
  ): Promise<ApiResponse<PaymentHistory>> {
    const response = await apiClient.get(`/payment-history/${id}`);
    return response.data;
  }

  // Create payment history
  async createPaymentHistory(
    data: CreatePaymentHistoryData
  ): Promise<ApiResponse<PaymentHistory>> {
    const response = await apiClient.post("/payment-history", data);
    return response.data;
  }

  // Update payment history
  async updatePaymentHistory(
    id: number,
    data: UpdatePaymentHistoryData
  ): Promise<ApiResponse<PaymentHistory>> {
    const response = await apiClient.put(`/payment-history/${id}`, data);
    return response.data;
  }

  // Delete payment history
  async deletePaymentHistory(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/payment-history/${id}`);
    return response.data;
  }
}

export const paymentHistoryApi = new PaymentHistoryApi();
