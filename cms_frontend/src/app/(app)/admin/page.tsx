"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/components/Dashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute role="admin">
      <Dashboard />
    </ProtectedRoute>
  );
}
