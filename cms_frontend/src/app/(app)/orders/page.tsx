"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UserOrders from "@/views/order/UserOrders";

export default function OrdersPage() {
  return (
    <ProtectedRoute role="user">
      <UserOrders />
    </ProtectedRoute>
  );
}
