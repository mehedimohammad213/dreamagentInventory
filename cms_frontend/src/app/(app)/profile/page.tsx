"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Profile from "@/components/profile/Profile";

export default function ProfilePage() {
  return (
    <ProtectedRoute role="user">
      <Profile />
    </ProtectedRoute>
  );
}
