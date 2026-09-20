"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseHistoryEditorPage from "@/views/purchase-history/PurchaseHistoryEditorPage";

export default function PurchaseHistoryEditPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryEditorPage />
    </ProtectedRoute>
  );
}
