"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserOrders from "@/components/order/UserOrders";

export default function OrdersPage() {
  return (
    <ProtectedRoute role="user">
      <UserOrders />
    </ProtectedRoute>
  );
}
