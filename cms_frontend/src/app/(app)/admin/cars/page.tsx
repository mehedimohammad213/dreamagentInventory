"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CarCatalog from "@/components/car/CarCatalog";

export default function AdminCarsPage() {
  return (
    <ProtectedRoute role="admin">
      <CarCatalog />
    </ProtectedRoute>
  );
}
