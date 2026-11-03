"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AccountingPage from "@/components/accounting/AccountingPage";

export default function AdminAccountingPage() {
  return (
    <ProtectedRoute roles={["admin", "accountant"]}>
      <AccountingPage />
    </ProtectedRoute>
  );
}
