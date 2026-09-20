"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Car from "@/views/car/Car";

export default function AdminCarsPage() {
  return (
    <ProtectedRoute role="admin">
      <Car />
    </ProtectedRoute>
  );
}
