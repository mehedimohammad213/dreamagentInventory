"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserManagement from "@/components/user/UserManagement";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute role="admin">
      <UserManagement />
    </ProtectedRoute>
  );
}
