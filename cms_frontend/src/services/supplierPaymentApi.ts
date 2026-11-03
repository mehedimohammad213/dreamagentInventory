import { apiClient } from "./apiClient";

export const SUPPLIER_PAYMENT_CATEGORIES = [
  "purchase_amount",
  "govt_duty",
  "cnf",
  "miscellaneous",
  "freight",
  "lc_margin",
  "other",
] as const;

export type SupplierPaymentCategory =
  (typeof SUPPLIER_PAYMENT_CATEGORIES)[number];

export interface SupplierPayment {
  id: number;
  payment_date: string;
  category: string;
  amount: number;
  description: string | null;
  supplier_name: string | null;
  purchase_history_id: number | null;
  car_id: number | null;
  bank_account_id: number;
  payment_method: "Bank" | "Cash" | null;
  reference: string | null;
  bank_account?: { id: number; name: string } | null;
  purchase_history?: { id: number; lc_number?: string | null } | null;
  car?: { id: number; chassis_no_full?: string | null; make?: string; model?: string } | null;
}

export interface CreateSupplierPaymentData {
  payment_date?: string;
  category?: string;
  amount: number;
  description?: string | null;
  supplier_name?: string | null;
  purchase_history_id?: number | null;
  car_id?: number | null;
  bank_account_id: number;
  payment_method?: "Bank" | "Cash" | null;
  reference?: string | null;
}

export const supplierPaymentApi = {
  async list(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/supplier-payments", { params });
    return response.data;
  },
  async create(data: CreateSupplierPaymentData) {
    const response = await apiClient.post("/supplier-payments", data);
    return response.data;
  },
  async update(id: number, data: Partial<CreateSupplierPaymentData>) {
    const response = await apiClient.put(`/supplier-payments/${id}`, data);
    return response.data;
  },
  async remove(id: number) {
    const response = await apiClient.delete(`/supplier-payments/${id}`);
    return response.data;
  },
};

export default supplierPaymentApi;
