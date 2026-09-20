"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UpdateCar from "@/views/car/UpdateCar";

export default function UpdateCarPage() {
  return (
    <ProtectedRoute role="admin">
      <UpdateCar />
    </ProtectedRoute>
  );
}
