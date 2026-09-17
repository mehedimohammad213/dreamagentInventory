import { AxiosError } from "axios";
import { apiClient } from "./apiClient";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number | null;
      to: number | null;
    };
  };
}

export interface UsersParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
}

export interface UpdateUserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  role: "admin" | "user";
}

export interface MutationResponse {
  success: boolean;
  message?: string;
  data?: { user: User };
  errors?: Record<string, string[]>;
}

export function formatUserApiError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const d = error.response.data as MutationResponse & {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (typeof d.message === "string" && d.message) {
      return d.message;
    }
    if (d.errors && typeof d.errors === "object") {
      const first = Object.values(d.errors)[0];
      if (Array.isArray(first) && first[0]) {
        return String(first[0]);
      }
    }
  }
  return "Request failed. Please try again.";
}

export const userApi = {
  async getAllUsers(params: UsersParams = {}): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);

    const response = await apiClient.get(
      `/users?${queryParams.toString()}`,
    );
    return response.data;
  },

  async createUser(
    payload: CreateUserPayload,
  ): Promise<MutationResponse> {
    const response = await apiClient.post("/users", payload);
    return response.data;
  },

  async updateUser(
    id: number,
    payload: UpdateUserPayload,
  ): Promise<MutationResponse> {
    const body: Record<string, unknown> = {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
    if (payload.password) {
      body.password = payload.password;
    }
    const response = await apiClient.put(`/users/${id}`, body);
    return response.data;
  },

  async deleteUser(id: number): Promise<MutationResponse> {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
