"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CreateCar from "@/components/car/CreateCar";

export default function CreateCarPage() {
  return (
    <ProtectedRoute role="admin">
      <CreateCar />
    </ProtectedRoute>
  );
}
