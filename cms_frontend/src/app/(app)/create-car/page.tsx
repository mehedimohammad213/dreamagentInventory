"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CreateCar from "@/views/car/CreateCar";

export default function CreateCarPage() {
  return (
    <ProtectedRoute role="admin">
      <CreateCar />
    </ProtectedRoute>
  );
}
