"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/components/Profile";

export default function ProfilePage() {
  return (
    <ProtectedRoute role="user">
      <Profile />
    </ProtectedRoute>
  );
}
