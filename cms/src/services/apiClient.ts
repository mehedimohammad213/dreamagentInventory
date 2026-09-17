import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Accept": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // localStorage might not be available in some environments
      console.warn('localStorage not available:', error);
    }
    // Ensure proper Content-Type based on payload
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData) {
      // Let the browser set the correct multipart/form-data boundary
      if (config.headers && "Content-Type" in config.headers) {
        delete (config.headers as any)["Content-Type"];
      }
    } else {
      // Default to JSON for non-FormData requests
      if (config.headers && !("Content-Type" in config.headers)) {
        (config.headers as any)["Content-Type"] = "application/json";
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export { apiClient };
