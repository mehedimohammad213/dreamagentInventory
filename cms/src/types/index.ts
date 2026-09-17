export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  image: string;
  category: string;
  fuelType: string;
  transmission: string;
  mileage: number;
  description?: string;
  features?: string[];
  stock: number;
  isAvailable: boolean;
}

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  email: string;
  name: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: "pending" | "approved" | "shipped" | "delivered" | "canceled";
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export interface OrderItem {
  carId: string;
  car: Car;
  quantity: number;
  price: number;
}

export interface CartItem {
  car: Car;
  quantity: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  monthlySales: MonthlySale[];
  topSellingCars: TopSellingCar[];
  topSellingBrands: TopSellingBrand[];
}

export interface MonthlySale {
  month: string;
  sales: number;
  orders: number;
}

export interface TopSellingCar {
  car: Car;
  totalSold: number;
  revenue: number;
}

export interface TopSellingBrand {
  brand: string;
  totalSold: number;
  revenue: number;
}

export interface FilterOptions {
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  fuelType?: string;
  transmission?: string;
  sortBy?: "price" | "year" | "mileage" | "name";
  sortOrder?: "asc" | "desc";
}
