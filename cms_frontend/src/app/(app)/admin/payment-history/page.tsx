"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PaymentHistory from "@/components/payment-history/PaymentHistory";

export default function PaymentHistoryPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <PaymentHistory />
    </ProtectedRoute>
  );
}
