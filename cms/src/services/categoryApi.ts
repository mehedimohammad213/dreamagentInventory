import axios from "axios";
import { API_BASE_URL } from "../config/api";

export interface Category {
  id: number;
  name: string;
  image?: string;
  parent_category_id?: number;
  parent_category?: {
    id: number;
    name: string;
  } | null;
  status: "active" | "inactive";
  short_des?: string;
  full_name: string;
  children_count: number;
  cars_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  image?: File | string;
  parent_category_id?: number;
  status?: "active" | "inactive";
  short_des?: string;
  type?: string;
  description?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: number;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: {
    categories?: Category[];
    category?: Category;
    parent_categories?: Category[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
}

class CategoryApiService {
  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    const token = localStorage.getItem("token");

    console.log(
      "CategoryApi: Token from localStorage:",
      token ? `${token.substring(0, 20)}...` : "NO TOKEN"
    );

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log("Making request to:", fullUrl);
    console.log("Request config:", config);

    try {
      const response = await axios({
        url: fullUrl,
        ...config,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("Response error:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error("CategoryApi: Authentication failed, clearing token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      throw new Error(
        `HTTP error! status: ${error.response?.status}, body: ${error.response?.data}`
      );
    }
  }

  async getCategories(
    params: {
      search?: string;
      status?: string;
      type?: string;
      parent_id?: string;
      sort_by?: string;
      sort_order?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<CategoryResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const url = `/categories?${searchParams.toString()}`;
    console.log("Making request to:", url);

    // For categories, we don't need authentication, so let's make a simple request
    try {
      const response = await axios.get(`${API_BASE_URL}${url}`);
      console.log("Categories API response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Categories API error:", error);
      throw new Error(
        `HTTP error! status: ${error.response?.status}, body: ${error.response?.data}`
      );
    }
  }

  async getCategory(id: number): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/categories/${id}`);
  }

  async createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "image" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.request<CategoryResponse>("/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      data: formData,
    });
  }

  async updateCategory(data: UpdateCategoryData): Promise<CategoryResponse> {
    const { id, ...updateData } = data;
    const formData = new FormData();

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "image" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.request<CategoryResponse>(`/categories/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-HTTP-Method-Override": "PUT",
      },
      data: formData,
    });
  }

  async deleteCategory(id: number): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getCategoryStats(): Promise<CategoryResponse> {
    return this.request<CategoryResponse>("/categories/stats/overview");
  }
}

export const categoryApi = new CategoryApiService();
