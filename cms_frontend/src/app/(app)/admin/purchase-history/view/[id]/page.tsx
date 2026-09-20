"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PurchaseHistoryDetails from "@/components/purchase-history/PurchaseHistoryDetails";

export default function PurchaseHistoryViewPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryDetails />
    </ProtectedRoute>
  );
}
