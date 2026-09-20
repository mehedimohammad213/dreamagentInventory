"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/components/Profile";

export default function AdminProfilePage() {
  return (
    <ProtectedRoute role="admin">
      <Profile />
    </ProtectedRoute>
  );
}
