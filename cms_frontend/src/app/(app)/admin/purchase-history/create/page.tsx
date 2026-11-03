"use client";

import { useEffect } from "react";
import { useNavigate } from "@/hooks/useNavigate";
import { peekNavigationState } from "@/lib/nav-state";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/** Legacy `/create` URL — redirect to `/add` (same editor as edit). */
function RedirectToPurchaseAdd() {
  const navigate = useNavigate();

  useEffect(() => {
    const state = peekNavigationState() ?? undefined;
    navigate("/admin/purchase-history/add", {
      replace: true,
      ...(state ? { state } : {}),
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );
}

export default function PurchaseHistoryCreatePage() {
  return (
    <ProtectedRoute role="admin">
      <RedirectToPurchaseAdd />
    </ProtectedRoute>
  );
}
