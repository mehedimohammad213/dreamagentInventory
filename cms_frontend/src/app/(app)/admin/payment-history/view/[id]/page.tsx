"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PaymentHistoryDetails from "@/components/payment-history/PaymentHistoryDetails";

export default function PaymentHistoryViewPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <PaymentHistoryDetails />
    </ProtectedRoute>
  );
}
