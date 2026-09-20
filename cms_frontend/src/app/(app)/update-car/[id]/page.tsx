"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UpdateCar from "@/components/car/UpdateCar";

export default function UpdateCarPage() {
  return (
    <ProtectedRoute role="admin">
      <UpdateCar />
    </ProtectedRoute>
  );
}
