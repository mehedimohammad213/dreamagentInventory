import { apiClient } from "./apiClient";

/** Aligned with car form (Location & Status) + inventory outcomes; matches `stocks.status` enum. */
export const STOCK_STATUS_VALUES = [
  "pending",
  "available",
  "sold",
  "reserved",
  "in_transit",
  "preorder",
  "damaged",
  "lost",
  "stolen",
] as const;

export type StockStatusValue = (typeof STOCK_STATUS_VALUES)[number];

export interface Stock {
  id: number;
  car_id: number | string; // Can be string from API
  quantity: number;
  price?: number | string; // Can be string from API
  status: StockStatusValue;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  car?: {
    id: number;
    category_id: string;
    subcategory_id?: string | null;
    ref_no?: string;
    code?: string | null;
    make: string;
    model: string;
    model_code?: string;
    variant?: string;
    year: number;
    reg_year_month?: string;
    mileage_km?: number;
    engine_cc?: number;
    transmission?: string;
    drive?: string;
    steering?: string;
    fuel?: string;
    color?: string;
    seats?: number;
    grade_overall?: string;
    grade_exterior?: string;
    grade_interior?: string;
    price_amount?: string;
    price_currency?: string;
    price_basis?: string;
    fob_value_usd?: number | null;
    freight_usd?: number | null;
    chassis_no_masked?: string;
    chassis_no_full?: string | null;
    location?: string;
    country_origin?: string;
    status: string;
    package?: string;
    keys_feature?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    category?: {
      id: number;
      name: string;
      image?: string | null;
      parent_category_id?: number | null;
      status: string;
      short_des?: string;
      created_at: string;
      updated_at: string;
    };
    subcategory?: {
      id: number;
      name: string;
    } | null;
    photos?: Array<{
      id: number;
      car_id: string;
      url: string;
      is_primary: boolean;
      sort_order: number;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface StockStatistics {
  total_stocks: number;
  total_quantity: number;
  total_value: number;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_category: Array<{
    name: string;
    count: number;
  }>;
}

export interface CreateStockData {
  car_id?: number;
  /** Ignored by API: stock quantity is always stored as 1 on create. */
  quantity?: number;
  price?: number;
  /** Ignored by API: stock status is derived from the car on create. */
  status?: StockStatusValue;
  notes?: string;
}

export interface UpdateStockData {
  /** Ignored by API: quantity is always stored as 1 on update. */
  quantity?: number;
  price?: number;
  /** Ignored by API: stock status is not changed from update requests. */
  status?: StockStatusValue;
  notes?: string;
}

export interface StockFilters {
  status?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_quantity?: number;
  max_quantity?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface BulkUpdateStatusData {
  stock_ids: number[];
  status: StockStatusValue;
}

class StockApiService {
  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });

      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || {};
      throw new Error(
        errorData.message || `HTTP error! status: ${error.response?.status}`
      );
    }
  }

  async getStocks(filters: StockFilters = {}): Promise<{
    success: boolean;
    data: Stock[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    message: string;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/stocks${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint);
  }

  async getStock(id: number): Promise<{
    success: boolean;
    data: Stock;
    message: string;
  }> {
    return this.request(`/stocks/${id}`);
  }

  async createStock(data: CreateStockData): Promise<{
    success: boolean;
    data: Stock;
    message: string;
  }> {
    return this.request("/stocks", {
      method: "POST",
      data: data,
    });
  }

  async updateStock(
    id: number,
    data: UpdateStockData
  ): Promise<{
    success: boolean;
    data: Stock;
    message: string;
  }> {
    return this.request(`/stocks/${id}`, {
      method: "PUT",
      data: data,
    });
  }

  async deleteStock(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/stocks/${id}`, {
      method: "DELETE",
    });
  }

  async getStockStatistics(): Promise<{
    success: boolean;
    data: StockStatistics;
    message: string;
  }> {
    return this.request("/stocks/stats/overview");
  }

  async bulkUpdateStatus(data: BulkUpdateStatusData): Promise<{
    success: boolean;
    message: string;
    updated_count: number;
  }> {
    return this.request("/stocks/bulk/status", {
      method: "PUT",
      data: data,
    });
  }

  async getAvailableCars(): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      make: string;
      model: string;
      year: number;
      ref_no?: string;
      category?: {
        id: number;
        name: string;
      };
      subcategory?: {
        id: number;
        name: string;
      };
      photos?: Array<{
        id: number;
        url: string;
        is_primary: boolean;
      }>;
    }>;
    message: string;
  }> {
    return this.request("/stocks/available/cars");
  }
}

export const stockApi = new StockApiService();
