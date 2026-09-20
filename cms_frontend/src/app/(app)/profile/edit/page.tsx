"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/components/Profile";

export default function ProfileEditPage() {
  return (
    <ProtectedRoute role="user">
      <Profile />
    </ProtectedRoute>
  );
}
