import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

export interface CarPhoto {
  id: number;
  car_id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarSubDetail {
  id: number;
  car_detail_id: number;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CarDetail {
  id: number;
  car_id: number;
  short_title?: string;
  full_title?: string;
  description?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  sub_details?: CarSubDetail[];
}

export interface Car {
  id: number;
  category_id: number;
  subcategory_id?: number;
  ref_no?: string;
  code?: string;
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
  grade_overall?: number | string;
  grade_exterior?: string;
  grade_interior?: string;
  price_amount?: number;
  price_currency: string;
  price_basis?: string;
  fob_value_usd?: number;
  freight_usd?: number;
  chassis_no_masked?: string;
  chassis_no_full?: string;
  location?: string;
  country_origin?: string;
  status: string;
  package?: string;
  body?: string;
  type?: string;
  engine_number?: string;
  number_of_keys?: number;
  keys_feature?: string;
  notes?: string;
  attached_file?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
  photos?: CarPhoto[];
  details?: CarDetail[];
  detail?: CarDetail; // Keep for backward compatibility

  // Computed fields
  primary_photo_url?: string;
  price_formatted?: string;
  year_formatted?: string;
  mileage_formatted?: string;
}

export interface CreateCarData {
  category_id?: number;
  subcategory_id?: number;
  ref_no?: string;
  code?: string;
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
  grade_overall?: number | string;
  grade_exterior?: string;
  grade_interior?: string;
  price_amount?: number;
  price_currency?: string;
  price_basis?: string;
  fob_value_usd?: number;
  freight_usd?: number;
  chassis_no_masked?: string;
  chassis_no_full?: string;
  location?: string;
  country_origin?: string;
  status?: string;
  package?: string;
  body?: string;
  type?: string;
  engine_number?: string;
  number_of_keys?: number;
  keys_feature?: string;
  notes?: string;
  attached_file?: File | string;

  photos?: {
    url: string;
    is_primary?: boolean;
    sort_order?: number;
    is_hidden?: boolean;
  }[];

  details?: {
    short_title?: string;
    full_title?: string;
    description?: string;
    images?: string[];
    sub_details?: {
      title?: string;
      description?: string;
    }[];
  }[];

  detail?: {
    short_title?: string;
    full_title?: string;
    description?: string;
    images?: string[];
    sub_details?: {
      title?: string;
      description?: string;
    }[];
  }; // Keep for backward compatibility
}

export interface UpdateCarData extends Partial<CreateCarData> {
  id: number;
}

export interface CarResponse {
  success: boolean;
  message: string;
  data: {
    // For paginated responses (like getCars)
    data?: Car[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
    // For single car responses (like getCar, createCar, updateCar)
    car?: Car;
    // For backward compatibility
    cars?: Car[];
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

export interface CarFilterOptions {
  categories: Array<{ id: number; name: string }>;
  makes: string[];
  models: string[];
  years: number[];
  transmissions: string[];
  fuels: string[];
  colors: string[];
  drives: string[];
  steerings: string[];
  countries: string[];
  statuses: string[];
}

class CarApiService {
  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    const token = localStorage.getItem("token");

    // Don't set Content-Type for FormData (file uploads)
    const defaultHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Only set Content-Type if not FormData
    if (!(options.data instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const config = {
      headers: {
        ...defaultHeaders,
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

      // Re-throw the original error to preserve response data
      throw error;
    }
  }

  async getCars(
    params: {
      search?: string;
      status?: string;
      category_id?: string;
      subcategory_id?: string;
      make?: string;
      model?: string;
      year?: string;
      year_from?: string;
      year_to?: string;
      price_from?: string;
      price_to?: string;
      mileage_from?: string;
      mileage_to?: string;
      transmission?: string;
      fuel?: string;
      color?: string;
      drive?: string;
      steering?: string;
      country?: string;
      sort_by?: string;
      sort_direction?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<CarResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const url = `/cars?${searchParams.toString()}`;
    console.log("Making request to:", url);
    return this.request<CarResponse>(url);
  }

  async getCar(id: number): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}`);
  }

  async createCar(data: CreateCarData | FormData): Promise<CarResponse> {
    return this.request<CarResponse>("/cars", {
      method: "POST",
      data: data,
    });
  }

  async updateCar(data: UpdateCarData | FormData): Promise<CarResponse> {
    if (data instanceof FormData) {
      // For FormData, extract the ID and send the rest
      const id = data.get('id');
      data.delete('id'); // Remove id from FormData as it's in the URL
      return this.request<CarResponse>(`/cars/${id}/update`, {
        method: "POST",
        data: data,
      });
    } else {
      // For regular objects, handle as before
      const { id, ...updateData } = data;
      return this.request<CarResponse>(`/cars/${id}/update`, {
        method: "POST",
        data: updateData,
      });
    }
  }

  async deleteCar(id: number): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}`, {
      method: "DELETE",
    });
  }

  async importFromExcel(file: File): Promise<CarResponse> {
    const formData = new FormData();
    formData.append("excel_file", file);

    return this.request<CarResponse>("/cars/import/excel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      data: formData,
    });
  }

  async updateCarPhotos(
    carId: number,
    photos: {
      url: string;
      is_primary?: boolean;
      sort_order?: number;
      is_hidden?: boolean;
    }[]
  ): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${carId}/photos`, {
      method: "PUT",
      data: { photos },
    });
  }

  async updateCarDetails(
    carId: number,
    detail: {
      short_title?: string;
      full_title?: string;
      description?: string;
      images?: string[];
      sub_details?: {
        title?: string;
        description?: string;
      }[];
    }
  ): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${carId}/details`, {
      method: "PUT",
      data: detail,
    });
  }

  async bulkUpdateStatus(
    carIds: number[],
    status: string
  ): Promise<CarResponse> {
    return this.request<CarResponse>("/cars/bulk/status", {
      method: "PUT",
      data: { car_ids: carIds, status },
    });
  }

  async getFilterOptions(): Promise<{
    success: boolean;
    data: CarFilterOptions;
  }> {
    return this.request<{ success: boolean; data: CarFilterOptions }>(
      "/cars/filter/options"
    );
  }

  async exportToExcel(): Promise<Blob> {
    const token = localStorage.getItem("token");
    const response = await axios.get(API_ENDPOINTS.CARS.EXPORT_EXCEL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    return response.data;
  }

  async getAttachedFile(carId: number): Promise<{
    success: boolean;
    data: {
      url: string;
      type: 'image' | 'pdf';
      filename: string;
    };
  }> {
    return this.request(`/cars/${carId}/attached-file`);
  }

  async downloadAttachedFile(carId: number): Promise<Blob> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/api/cars/${carId}/attached-file/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    return response.data;
  }
}

export const carApi = new CarApiService();
