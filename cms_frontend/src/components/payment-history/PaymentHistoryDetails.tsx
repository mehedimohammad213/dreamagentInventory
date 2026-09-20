"use client";

import { useNavigate } from "@/hooks/useNavigate";
import { useParams } from "next/navigation";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Building2,
  User,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Car,
  Download,
} from "lucide-react";
import { CurrencyBDTIcon } from "../../components/icons/CurrencyBDTIcon";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import {
  paymentHistoryApi,
  PaymentHistory,
} from "../../services/paymentHistoryApi";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import PaymentHistoryModal from "../../components/payment-history/PaymentHistoryModal";
import { PaymentHistoryInvoiceService } from "../../services/paymentHistoryInvoiceService";

const PaymentHistoryDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, [id]);

  const fetchPaymentHistory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await paymentHistoryApi.getPaymentHistory(parseInt(id));
      if (response.success && response.data) {
        setPaymentHistory(response.data);
      } else {
        toast.error("Payment history not found");
        navigate("/admin/payment-history");
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to load payment history");
      navigate("/admin/payment-history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!paymentHistory) return;

    setIsDeleting(true);
    try {
      const response = await paymentHistoryApi.deletePaymentHistory(
        paymentHistory.id
      );
      if (response.success) {
        toast.success("Payment history deleted successfully");
        navigate("/admin/payment-history");
      } else {
        toast.error(response.message || "Failed to delete payment history");
      }
    } catch (error) {
      console.error("Error deleting payment history:", error);
      toast.error("Failed to delete payment history");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    navigate("/admin/payment-history");
  };

  const handleDownloadInvoice = () => {
    if (paymentHistory) {
      PaymentHistoryInvoiceService.generateSalesTrackingReport(paymentHistory);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "N/A";
    const numericAmount = toNumber(amount);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!paymentHistory) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Payment history not found</p>
        <button
          onClick={() => navigate("/admin/payment-history")}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Payment History
        </button>
      </div>
    );
  }

  const totalInstallmentAmount =
    paymentHistory.installments?.reduce(
      (sum, inst) => sum + toNumber(inst.amount),
      0
    ) || 0;

  const firstInstallmentAmount =
    paymentHistory.installments?.[0]?.amount ?? null;
  const secondInstallmentAmount =
    paymentHistory.installments?.[1]?.amount ?? null;

  const remainingBalance = Math.max(
    toNumber(paymentHistory.purchase_amount) - totalInstallmentAmount,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/payment-history")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Payment History
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Information */}
          {paymentHistory.car && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Car className="w-6 h-6 text-primary-600" />
                Car Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Car
                  </label>
                  <p className="text-gray-900 font-medium">
                    {paymentHistory.car.make} {paymentHistory.car.model}
                    {(paymentHistory.car.chassis_no_full || paymentHistory.car.chassis_no_masked) &&
                      ` (${paymentHistory.car.chassis_no_full || paymentHistory.car.chassis_no_masked})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wholesaler Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              Wholesaler Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Showroom Name
                </label>
                <p className="text-gray-900 font-medium">
                  {paymentHistory.showroom_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Purchase Date
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(paymentHistory.purchase_date)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Purchase Amount
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                  {formatCurrency(paymentHistory.purchase_amount)}
                </div>
              </div>
              {paymentHistory.wholesaler_address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <div className="flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <p className="font-medium">
                      {paymentHistory.wholesaler_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-primary-600" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Customer Name
                </label>
                <p className="text-gray-900 font-medium">
                  {paymentHistory.customer_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  NID Number
                </label>
                <p className="text-gray-900 font-medium">
                  {paymentHistory.nid_number || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  TIN Certificate
                </label>
                <p className="text-gray-900 font-medium">
                  {paymentHistory.tin_certificate || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Contact Number
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {paymentHistory.contact_number || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {paymentHistory.email || "N/A"}
                </div>
              </div>
              {paymentHistory.customer_address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <div className="flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <p className="font-medium">
                      {paymentHistory.customer_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Installments */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary-600" />
              Installments ({paymentHistory.installments?.length || 0})
            </h2>
            {!paymentHistory.installments ||
              paymentHistory.installments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No installments recorded
              </p>
            ) : (
              <div className="space-y-4">
                {paymentHistory.installments.map((installment, index) => (
                  <div
                    key={installment.id}
                    className="border-2 border-primary-200 bg-white rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Installment #{index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${installment.payment_method === "Bank"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-green-100 text-green-700"
                            }`}
                        >
                          {installment.payment_method || "N/A"}
                        </span>
                        {installment.status && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${installment.status === 'Paid' ? 'bg-green-100 text-green-700' :
                              installment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                installment.status === 'Bank Check' ? 'bg-blue-100 text-blue-700' :
                                  installment.status === 'Withdraw' ? 'bg-purple-100 text-purple-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            {installment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Installment Date
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(installment.installment_date)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Amount
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                          {formatCurrency(installment.amount)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Balance
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                          {formatCurrency(installment.balance)}
                        </div>
                      </div>
                      {installment.payment_method === "Bank" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Bank Name
                            </label>
                            <p className="text-gray-900 font-medium">
                              {installment.bank_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Cheque Number
                            </label>
                            <p className="text-gray-900 font-medium">
                              {installment.cheque_number || "N/A"}
                            </p>
                          </div>
                        </>
                      )}
                      {installment.description && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Description
                          </label>
                          <p className="text-gray-900">
                            {installment.description}
                          </p>
                        </div>
                      )}
                      {installment.remarks && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Remarks
                          </label>
                          <p className="text-gray-900">{installment.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Record ID
                </label>
                <p className="text-gray-900 font-semibold">
                  #{paymentHistory.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {formatDate(paymentHistory.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {formatDate(paymentHistory.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">Purchase Amount:</span>
                <span className="font-bold">
                  {formatCurrency(paymentHistory.purchase_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">1st Installment:</span>
                <span className="font-bold">
                  {formatCurrency(firstInstallmentAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">2nd Installment:</span>
                <span className="font-bold">
                  {formatCurrency(secondInstallmentAmount)}
                </span>
              </div>
              <div className="pt-3 border-t border-primary-400">
                <div className="flex justify-between">
                  <span className="text-primary-100 font-bold">Remaining Balance:</span>
                  <span className="font-bold">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <PaymentHistoryModal
            isOpen={showEditModal}
            mode="update"
            paymentHistory={paymentHistory}
            onClose={() => setShowEditModal(false)}
            onSubmit={async (data) => {
              if (paymentHistory) {
                try {
                  const response = await paymentHistoryApi.updatePaymentHistory(
                    paymentHistory.id,
                    data as any
                  );
                  if (response.success) {
                    toast.success("Payment history updated successfully");
                    handleEditSuccess();
                  } else {
                    toast.error(
                      response.message || "Failed to update payment history"
                    );
                  }
                } catch (error) {
                  console.error("Error updating payment history:", error);
                  toast.error("Failed to update payment history");
                }
              }
            }}
          />

          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            title="Delete Payment History"
            message={`Are you sure you want to delete payment history #${paymentHistory.id}? This action will also delete all associated installments and cannot be undone.`}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default PaymentHistoryDetails;
