"use client";

import { useEffect } from "react";
import { useNavigate } from "@/hooks/useNavigate";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/** Legacy `/edit` URL — payment edit opens as a drawer on the list. */
function RedirectToPaymentList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    navigate("/admin/payment-history", {
      replace: true,
      state: id ? { editPaymentId: Number(id) } : undefined,
    });
  }, [navigate, id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );
}

export default function PaymentHistoryEditPage() {
  return (
    <ProtectedRoute role="admin">
      <RedirectToPaymentList />
    </ProtectedRoute>
  );
}
