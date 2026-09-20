"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentHistory from "@/views/payment-history/PaymentHistory";

export default function PaymentHistoryPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <PaymentHistory />
    </ProtectedRoute>
  );
}
