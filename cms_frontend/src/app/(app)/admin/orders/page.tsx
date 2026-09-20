"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminOrders from "@/components/order/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute role="admin">
      <AdminOrders />
    </ProtectedRoute>
  );
}
