"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminOrders from "@/views/order/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute role="admin">
      <AdminOrders />
    </ProtectedRoute>
  );
}
