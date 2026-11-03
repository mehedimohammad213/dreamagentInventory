"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AccountsPage from "@/components/accounting/AccountsPage";

export default function AdminAccountsPage() {
  return (
    <ProtectedRoute roles={["admin", "accountant"]}>
      <AccountsPage />
    </ProtectedRoute>
  );
}
