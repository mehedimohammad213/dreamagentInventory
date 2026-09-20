"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Profile from "@/components/profile/Profile";

export default function AdminProfilePage() {
  return (
    <ProtectedRoute role="admin">
      <Profile />
    </ProtectedRoute>
  );
}
