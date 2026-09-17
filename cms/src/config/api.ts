// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite environment variables
  return (
    import.meta.env?.VITE_API_BASE_URL ||
    "https://backend.dreamagentcarvision.com/api"
  );
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    USER: `${API_BASE_URL}/auth/user`,
  },
  CARS: {
    BASE: `${API_BASE_URL}/cars`,
    EXPORT_EXCEL: `${API_BASE_URL}/cars/export/excel`,
    IMPORT_EXCEL: `${API_BASE_URL}/cars/import/excel`,
    FILTER_OPTIONS: `${API_BASE_URL}/cars/filter/options`,
  },
  CATEGORIES: {
    BASE: `${API_BASE_URL}/categories`,
    STATS: `${API_BASE_URL}/categories/stats/overview`,
  },
  STOCKS: {
    BASE: `${API_BASE_URL}/stocks`,
    STATS: `${API_BASE_URL}/stocks/stats/overview`,
    AVAILABLE_CARS: `${API_BASE_URL}/stocks/available/cars`,
  },
  CART: {
    BASE: `${API_BASE_URL}/cart`,
    SUMMARY: `${API_BASE_URL}/cart/summary`,
    CLEAR: `${API_BASE_URL}/cart/clear`,
  },
};
