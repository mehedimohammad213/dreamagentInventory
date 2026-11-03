import { apiClient } from "./apiClient";
import type { BankAccount } from "./bankAccountApi";

export type ExpenseCategory =
  | "rent"
  | "salary"
  | "transport"
  | "utility"
  | "marketing"
  | "customs"
  | "other";

export interface Expense {
  id: number;
  expense_date: string;
  category: ExpenseCategory | string;
  amount: number;
  description: string | null;
  bank_account_id: number;
  payment_method: "Bank" | "Cash" | null;
  reference: string | null;
  bank_account?: BankAccount | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseData {
  expense_date?: string;
  category?: ExpenseCategory | string;
  amount: number;
  description?: string | null;
  bank_account_id: number;
  payment_method?: "Bank" | "Cash" | null;
  reference?: string | null;
}

export type UpdateExpenseData = Partial<CreateExpenseData>;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "rent",
  "salary",
  "transport",
  "utility",
  "marketing",
  "customs",
  "other",
];

export const expenseApi = {
  async list(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/expenses", { params });
    return response.data;
  },

  async get(id: number) {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  async create(data: CreateExpenseData) {
    const response = await apiClient.post("/expenses", data);
    return response.data;
  },

  async update(id: number, data: UpdateExpenseData) {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  async remove(id: number) {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseApi;
