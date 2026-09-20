"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CategoryManagement from "@/views/category/CategoryManagement";

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute role="admin">
      <CategoryManagement />
    </ProtectedRoute>
  );
}
