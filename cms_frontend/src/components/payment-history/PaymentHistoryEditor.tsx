"use client";

import { useNavigate } from "@/hooks/useNavigate";
import { useParams } from "next/navigation";
import { useNavigationState } from "@/hooks/useNavigationState";
import { peekNavigationState } from "@/lib/nav-state";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "react-toastify";
import PaymentHistoryModal from "./PaymentHistoryModal";
import {
  paymentHistoryApi,
  PaymentHistory,
  CreatePaymentHistoryData,
  UpdatePaymentHistoryData,
} from "@/services/paymentHistoryApi";
import type { Car } from "@/services/carApi";

type LocationState = {
  /** Car looked up by chassis before opening the create form */
  prefilledCar?: Car;
};

function resolveLocationState(): LocationState | null {
  return peekNavigationState<LocationState>();
}

function messageFromError(error: unknown, fallback: string) {
  const data = (
    error as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[] | string> };
      };
    }
  )?.response?.data;
  const firstError = data?.errors ? Object.values(data.errors)[0] : undefined;
  if (Array.isArray(firstError) && firstError[0]) return String(firstError[0]);
  if (typeof firstError === "string") return firstError;
  if (data?.message) return data.message;
  return fallback;
}

const PaymentHistoryEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const navStateHook = useNavigationState<LocationState>();

  const isCreate = !id;
  const mode: "create" | "update" = isCreate ? "create" : "update";
  const navState = resolveLocationState() ?? navStateHook;

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(
    null
  );
  const [loading, setLoading] = useState(!isCreate);

  const goBack = useCallback(() => {
    navigate("/admin/payment-history");
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isCreate) {
        setPaymentHistory(null);
        setLoading(false);
        return;
      }

      const numId = parseInt(id!, 10);
      if (Number.isNaN(numId)) {
        toast.error("Invalid payment id");
        navigate("/admin/payment-history", { replace: true });
        return;
      }

      setLoading(true);
      try {
        const response = await paymentHistoryApi.getPaymentHistory(numId);
        if (cancelled) return;
        if (response.success && response.data) {
          setPaymentHistory(response.data);
        } else {
          toast.error(response.message || "Payment history not found");
          navigate("/admin/payment-history", { replace: true });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Failed to load payment history");
          navigate("/admin/payment-history", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate, navigate]);

  const handleSubmit = async (
    data: CreatePaymentHistoryData | UpdatePaymentHistoryData
  ) => {
    try {
      if (mode === "update" && paymentHistory) {
        const response = await paymentHistoryApi.updatePaymentHistory(
          paymentHistory.id,
          data as UpdatePaymentHistoryData
        );
        if (response.success) {
          toast.success("Payment history updated successfully");
          navigate("/admin/payment-history");
        } else {
          toast.error(response.message || "Failed to update payment history");
        }
        return;
      }

      const response = await paymentHistoryApi.createPaymentHistory(
        data as CreatePaymentHistoryData
      );
      if (response.success) {
        toast.success("Payment history created successfully");
        navigate("/admin/payment-history");
      } else {
        toast.error(response.message || "Failed to create payment history");
      }
    } catch (error) {
      console.error("Error saving payment history:", error);
      toast.error(messageFromError(error, "Failed to save payment history"));
    }
  };

  const { pageTitle, pageSubtitle } = useMemo(() => {
    if (isCreate) {
      return {
        pageTitle: "Add Payment History",
        pageSubtitle: "Record customer payment and installment details",
      };
    }
    if (paymentHistory) {
      return {
        pageTitle: `Edit Payment #${paymentHistory.id}`,
        pageSubtitle: "Update payment and installment information",
      };
    }
    return {
      pageTitle: "Edit Payment History",
      pageSubtitle: "Update payment records",
    };
  }, [isCreate, paymentHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pt-6">
        <div className="mb-4 px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-2 shrink-0 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="font-medium">Back</span>
              </button>
              <div className="min-w-0 sm:border-l sm:border-gray-200 sm:dark:border-gray-600 sm:pl-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {pageSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <PaymentHistoryModal
          variant="page"
          isOpen
          mode={mode}
          paymentHistory={paymentHistory}
          initialCar={isCreate ? navState?.prefilledCar ?? null : null}
          onClose={goBack}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default PaymentHistoryEditor;
