"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PurchaseHistoryEditor from "@/components/purchase-history/PurchaseHistoryEditor";

export default function PurchaseHistoryEditPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryEditor />
    </ProtectedRoute>
  );
}
