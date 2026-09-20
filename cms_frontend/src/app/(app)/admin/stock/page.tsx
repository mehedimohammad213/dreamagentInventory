"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StockManagement from "@/components/stock/StockManagement";

export default function AdminStockPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <StockManagement />
    </ProtectedRoute>
  );
}
