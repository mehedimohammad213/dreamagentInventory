"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PurchaseHistoryEditor from "@/components/purchase-history/PurchaseHistoryEditor";

/** Add purchase — same page shell as edit (`PurchaseHistoryEditor`). */
export default function PurchaseHistoryAddPage() {
  return (
    <ProtectedRoute role="admin">
      <PurchaseHistoryEditor />
    </ProtectedRoute>
  );
}
