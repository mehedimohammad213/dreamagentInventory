"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PurchaseHistory from "@/components/purchase-history/PurchaseHistory";

export default function PurchaseHistoryPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistory />
    </ProtectedRoute>
  );
}
