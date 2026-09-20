"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseHistoryDetails from "@/views/purchase-history/PurchaseHistoryDetails";

export default function PurchaseHistoryViewPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryDetails />
    </ProtectedRoute>
  );
}
