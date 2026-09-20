"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentHistoryDetails from "@/views/payment-history/PaymentHistoryDetails";

export default function PaymentHistoryViewPage() {
  return (
    <ProtectedRoute roles={["admin", "user"]}>
      <PaymentHistoryDetails />
    </ProtectedRoute>
  );
}
