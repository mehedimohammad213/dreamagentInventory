import { apiClient } from "./apiClient";

export type AccountType = "bank" | "cash";
export type TransactionType = "in" | "out" | "transfer";

export interface BankAccount {
  id: number;
  name: string;
  bank_name: string | null;
  branch_name: string | null;
  account_number: string | null;
  account_type: AccountType;
  currency: string;
  opening_balance: number;
  opening_balance_date: string | null;
  is_active: boolean;
  notes: string | null;
  current_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  txn_date: string;
  type: TransactionType;
  amount: number;
  reference: string | null;
  notes: string | null;
  source_type: string | null;
  source_id: number | null;
  related_account_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBankAccountData {
  name: string;
  bank_name?: string | null;
  branch_name?: string | null;
  account_number?: string | null;
  account_type: AccountType;
  currency?: string;
  opening_balance?: number;
  opening_balance_date?: string | null;
  is_active?: boolean;
  notes?: string | null;
}

export type UpdateBankAccountData = Partial<CreateBankAccountData>;

export const bankAccountApi = {
  async list(params?: Record<string, string | number | boolean | undefined>) {
    const response = await apiClient.get("/bank-accounts", { params });
    return response.data;
  },

  async get(id: number) {
    const response = await apiClient.get(`/bank-accounts/${id}`);
    return response.data;
  },

  async create(data: CreateBankAccountData) {
    const response = await apiClient.post("/bank-accounts", data);
    return response.data;
  },

  async update(id: number, data: UpdateBankAccountData) {
    const response = await apiClient.put(`/bank-accounts/${id}`, data);
    return response.data;
  },

  async remove(id: number) {
    const response = await apiClient.delete(`/bank-accounts/${id}`);
    return response.data;
  },

  async listTransactions(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/bank-accounts/transactions", { params });
    return response.data;
  },

  async createTransaction(data: {
    bank_account_id: number;
    type: "in" | "out";
    amount: number;
    txn_date?: string;
    reference?: string | null;
    notes?: string | null;
  }) {
    const response = await apiClient.post("/bank-accounts/transactions", data);
    return response.data;
  },

  async transfer(data: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    txn_date?: string;
    reference?: string | null;
    notes?: string | null;
  }) {
    const response = await apiClient.post("/bank-accounts/transfer", data);
    return response.data;
  },
};

export default bankAccountApi;
