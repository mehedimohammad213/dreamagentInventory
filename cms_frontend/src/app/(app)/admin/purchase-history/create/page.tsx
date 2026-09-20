"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PurchaseHistoryEditor from "@/components/purchase-history/PurchaseHistoryEditor";

export default function PurchaseHistoryCreatePage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryEditor />
    </ProtectedRoute>
  );
}
