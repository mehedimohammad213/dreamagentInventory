"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/components/dashboard/Dashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute role="admin">
      <Dashboard />
    </ProtectedRoute>
  );
}
