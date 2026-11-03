"use client";

import { useNavigate } from "@/hooks/useNavigate";
import { useNavigationState } from "@/hooks/useNavigationState";
import { clearNavigationState } from "@/lib/nav-state";

import React, { useState, useEffect } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import {
  paymentHistoryApi,
  PaymentHistory,
  CreatePaymentHistoryData,
  UpdatePaymentHistoryData,
} from "../../services/paymentHistoryApi";
import PaymentHistoryModal from "../../components/payment-history/PaymentHistoryModal";
import PaymentHistoryTable from "../../components/payment-history/PaymentHistoryTable";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ChassisLookupModal from "@/components/common/ChassisLookupModal";
import Pagination from "../../components/common/Pagination";
import {
  chassisAlreadyHasPaymentMessage,
  findCarByChassis,
} from "@/utils/findCarByChassis";
import type { Car } from "@/services/carApi";

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

const PaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const navState = useNavigationState<{
    prefilledCar?: Car;
    editPaymentId?: number;
  }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [paymentHistories, setPaymentHistories] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [selectedPaymentHistory, setSelectedPaymentHistory] =
    useState<PaymentHistory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentHistoryToDelete, setPaymentHistoryToDelete] =
    useState<PaymentHistory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChassisModal, setShowChassisModal] = useState(false);
  const [prefilledCar, setPrefilledCar] = useState<Car | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchPaymentHistories();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (!isAdmin || !navState) return;

    if (navState.prefilledCar) {
      setPrefilledCar(navState.prefilledCar);
      setSelectedPaymentHistory(null);
      setModalMode("create");
      setShowModal(true);
      clearNavigationState();
      return;
    }

    if (navState.editPaymentId) {
      const openEdit = async () => {
        try {
          const response = await paymentHistoryApi.getPaymentHistory(
            navState.editPaymentId!
          );
          if (response.success && response.data) {
            setPrefilledCar(null);
            setSelectedPaymentHistory(response.data);
            setModalMode("update");
            setShowModal(true);
          } else {
            toast.error(response.message || "Payment history not found");
          }
        } catch (error) {
          console.error("Error loading payment for edit:", error);
          toast.error("Failed to load payment history");
        } finally {
          clearNavigationState();
        }
      };
      openEdit();
    }
  }, [navState, isAdmin]);

  const fetchPaymentHistories = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: perPage,
        sort_by: "created_at",
        sort_order: "desc",
      };

      if (searchTerm) params.search = searchTerm;

      const response = await paymentHistoryApi.getPaymentHistories(params);

      setPaymentHistories(response.data || []);
      setTotalPages(response.last_page || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error fetching payment histories:", error);
      toast.error("Failed to fetch payment histories");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = (car: Car) => {
    setPrefilledCar(car);
    setSelectedPaymentHistory(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleCreate = () => {
    setPrefilledCar(null);
    setSelectedPaymentHistory(null);
    setShowChassisModal(true);
  };

  const handleChassisValidate = async (chassis: string) => {
    const car = await findCarByChassis(chassis);
    if (!car) {
      return "No vehicle found with this chassis number.";
    }

    const alreadyPaid = await chassisAlreadyHasPaymentMessage(chassis);
    if (alreadyPaid) return alreadyPaid;

    setShowChassisModal(false);
    openCreateDrawer(car);
  };

  const handleView = (paymentHistory: PaymentHistory) => {
    navigate(`/admin/payment-history/view/${paymentHistory.id}`);
  };

  const handleEdit = (paymentHistory: PaymentHistory) => {
    setPrefilledCar(null);
    setSelectedPaymentHistory(paymentHistory);
    setModalMode("update");
    setShowModal(true);
  };

  const handleDelete = (paymentHistory: PaymentHistory) => {
    setPaymentHistoryToDelete(paymentHistory);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!paymentHistoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await paymentHistoryApi.deletePaymentHistory(
        paymentHistoryToDelete.id
      );
      if (response.success) {
        toast.success("Payment history deleted successfully");
        fetchPaymentHistories();
        setShowDeleteModal(false);
        setPaymentHistoryToDelete(null);
      } else {
        toast.error(response.message || "Failed to delete payment history");
      }
    } catch (error) {
      console.error("Error deleting payment history:", error);
      toast.error("Failed to delete payment history");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (
    data: CreatePaymentHistoryData | UpdatePaymentHistoryData
  ) => {
    try {
      if (modalMode === "update" && selectedPaymentHistory) {
        const response = await paymentHistoryApi.updatePaymentHistory(
          selectedPaymentHistory.id,
          data as UpdatePaymentHistoryData
        );
        if (response.success) {
          toast.success("Payment history updated successfully");
          setShowModal(false);
          setSelectedPaymentHistory(null);
          setPrefilledCar(null);
          fetchPaymentHistories();
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
        setShowModal(false);
        setPrefilledCar(null);
        fetchPaymentHistories();
      } else {
        toast.error(response.message || "Failed to create payment history");
      }
    } catch (error) {
      console.error("Error saving payment history:", error);
      toast.error(messageFromError(error, "Failed to save payment history"));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6 mb-6">
          <div className="p-0 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">
                  Payments / Payment History
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by showroom name, NID, contact number, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {searchTerm && (
              <button
                onClick={handleClearFilters}
                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="Clear Filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {isAdmin && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Payment History
              </button>
            )}
          </div>
        </div>

        <PaymentHistoryTable
          paymentHistories={paymentHistories}
          isLoading={loading}
          canManage={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onRefresh={fetchPaymentHistories}
        />

        {totalItems > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {isAdmin && (
          <>
            <ChassisLookupModal
              isOpen={showChassisModal}
              title="Add Payment History"
              description="Enter the vehicle's chassis number to proceed."
              placeholder="Enter unique chassis number..."
              onClose={() => setShowChassisModal(false)}
              onValidate={handleChassisValidate}
            />

            <PaymentHistoryModal
              isOpen={showModal}
              mode={modalMode}
              paymentHistory={selectedPaymentHistory}
              initialCar={modalMode === "create" ? prefilledCar : null}
              onClose={() => {
                setShowModal(false);
                setSelectedPaymentHistory(null);
                setPrefilledCar(null);
              }}
              onSubmit={handleModalSubmit}
            />

            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              title="Delete Payment History"
              message={`Are you sure you want to delete payment history #${paymentHistoryToDelete?.id}? This action will also delete all associated installments and cannot be undone.`}
              onClose={() => {
                setShowDeleteModal(false);
                setPaymentHistoryToDelete(null);
              }}
              onConfirm={confirmDelete}
              isLoading={isDeleting}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
