"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import StockManagement from "@/views/stock/StockManagement";

export default function AdminStockPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <StockManagement />
    </ProtectedRoute>
  );
}
