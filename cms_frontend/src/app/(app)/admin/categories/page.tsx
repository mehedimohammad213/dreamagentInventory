"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CategoryManagement from "@/components/category/CategoryManagement";

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute role="admin">
      <CategoryManagement />
    </ProtectedRoute>
  );
}
