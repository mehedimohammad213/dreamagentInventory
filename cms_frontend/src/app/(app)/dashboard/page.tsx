"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/components/Dashboard";

export default function UserDashboardPage() {
  return (
    <ProtectedRoute role="user">
      <Dashboard />
    </ProtectedRoute>
  );
}
