"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseHistory from "@/views/purchase-history/PurchaseHistory";

export default function PurchaseHistoryPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistory />
    </ProtectedRoute>
  );
}
