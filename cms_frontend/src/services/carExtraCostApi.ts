import { apiClient } from "./apiClient";

export const EXTRA_COST_CATEGORIES = [
  "repair",
  "transport",
  "reconditioning",
  "documentation",
  "other",
] as const;

export interface CarExtraCost {
  id: number;
  car_id: number;
  cost_date: string;
  category: string;
  amount: number;
  description: string | null;
  bank_account_id: number | null;
  payment_method: "Bank" | "Cash" | null;
  bank_account?: { id: number; name: string } | null;
}

export interface CreateCarExtraCostData {
  car_id: number;
  cost_date?: string;
  category?: string;
  amount: number;
  description?: string | null;
  bank_account_id?: number | null;
  payment_method?: "Bank" | "Cash" | null;
}

export const carExtraCostApi = {
  async list(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/car-extra-costs", { params });
    return response.data;
  },
  async create(data: CreateCarExtraCostData) {
    const response = await apiClient.post("/car-extra-costs", data);
    return response.data;
  },
  async update(id: number, data: Partial<CreateCarExtraCostData>) {
    const response = await apiClient.put(`/car-extra-costs/${id}`, data);
    return response.data;
  },
  async remove(id: number) {
    const response = await apiClient.delete(`/car-extra-costs/${id}`);
    return response.data;
  },
};

export default carExtraCostApi;
