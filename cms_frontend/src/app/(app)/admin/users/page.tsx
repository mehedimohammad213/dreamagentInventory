"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UserManagement from "@/views/user/UserManagement";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute role="admin">
      <UserManagement />
    </ProtectedRoute>
  );
}
