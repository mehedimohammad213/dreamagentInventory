import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Download,
  Calendar,
  Building2,
  FileCheck,
  Receipt,
  AlertCircle,
  Car as CarIcon,
} from "lucide-react";
import { CurrencyBDTIcon } from "../../components/icons/CurrencyBDTIcon";
import { toast } from "react-toastify";
import {
  purchaseHistoryApi,
  PurchaseHistory,
} from "../../services/purchaseHistoryApi";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import {
  purchaseHistoryPath,
  type PurchasePageTab,
} from "../../utils/purchaseNavigation";

const PurchaseHistoryDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const returnPurchaseTab = (
    location.state as { returnPurchaseTab?: PurchasePageTab } | null
  )?.returnPurchaseTab;

  const goToPurchaseList = () =>
    navigate(purchaseHistoryPath(returnPurchaseTab));
  const [purchaseHistory, setPurchaseHistory] =
    useState<PurchaseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPurchaseHistory();
  }, [id]);

  const fetchPurchaseHistory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await purchaseHistoryApi.getPurchaseHistory(
        parseInt(id)
      );
      if (response.success && response.data) {
        setPurchaseHistory(response.data);
      } else {
        toast.error("Purchase history not found");
        goToPurchaseList();
      }
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      toast.error("Failed to load purchase history");
      goToPurchaseList();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!purchaseHistory) return;

    setIsDeleting(true);
    try {
      const response = await purchaseHistoryApi.deletePurchaseHistory(
        purchaseHistory.id
      );
      if (response.success) {
        toast.success("Purchase history deleted successfully");
        goToPurchaseList();
      } else {
        toast.error(response.message || "Failed to delete purchase history");
      }
    } catch (error) {
      console.error("Error deleting purchase history:", error);
      toast.error("Failed to delete purchase history");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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

  const toNumber = (
    value: number | string | null | undefined
  ): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = parseFloat(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatCurrency = (
    amount: number | string | null | undefined
  ): string => {
    if (amount === null || amount === undefined) return "N/A";
    if (typeof amount === "string" && !amount.trim()) return "N/A";
    const numericAmount = toNumber(amount);
    if (numericAmount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
    }).format(numericAmount);
  };

  const getPdfUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:8000";
    return `${baseUrl}${path}`;
  };

  const handleViewPdf = async (path: string | null, field: string) => {
    if (!path || !purchaseHistory) {
      toast.error("PDF file not available");
      return;
    }

    try {
      // For external URLs, open directly
      if (path.startsWith("http")) {
        window.open(path, "_blank");
        return;
      }

      // For local files, use the download endpoint to get the file
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const url = `${baseUrl}/purchase-history/${purchaseHistory.id}/pdf/download?field=${encodeURIComponent(field)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load PDF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");

      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("Error viewing PDF:", error);
      toast.error("Failed to view PDF file");
    }
  };

  const handleDownloadPdf = async (path: string | null, field: string, filename: string) => {
    if (!path || !purchaseHistory) {
      toast.error("PDF file not available");
      return;
    }

    try {
      await purchaseHistoryApi.downloadPdf(purchaseHistory.id, field, filename);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF file");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!purchaseHistory) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Purchase history not found</p>
        <button
          onClick={() => goToPurchaseList()}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Purchase History
        </button>
      </div>
    );
  }

  const pdfFields = [
    { key: "bill_of_lading", label: "Bill of Lading" },
    { key: "invoice_number", label: "Invoice Number" },
    { key: "export_certificate", label: "Export Certificate" },
    {
      key: "export_certificate_translated",
      label: "Export Certificate (Translated)",
    },
    { key: "bill_of_exchange_amount", label: "Bill of Exchange Amount" },
    { key: "custom_duty_copy_3pages", label: "Custom Duty Copy (3 Pages)" },
    { key: "cheque_copy", label: "Cheque Copy" },
    { key: "certificate", label: "Certificate" },
    { key: "custom_one", label: "Custom One" },
    { key: "custom_two", label: "Custom Two" },
    { key: "custom_three", label: "Custom Three" },
  ];

  const purchaseAmountValue = toNumber(purchaseHistory.purchase_amount);
  const govtDutyValue = toNumber(purchaseHistory.govt_duty);
  const cnfAmountValue = toNumber(purchaseHistory.cnf_amount);
  const miscellaneousValue = toNumber(purchaseHistory.miscellaneous);

  const hasCostValues = [
    purchaseAmountValue,
    toNumber(purchaseHistory.foreign_amount),
    toNumber(purchaseHistory.bdt_amount),
    govtDutyValue,
    cnfAmountValue,
    miscellaneousValue,
  ].some((value) => value !== null);

  const calculatedPurchaseAmount = hasCostValues
    ? (purchaseAmountValue || 0) +
    (govtDutyValue || 0) +
    (cnfAmountValue || 0) +
    (miscellaneousValue || 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => goToPurchaseList()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Purchase History
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate(`/admin/purchase-history/edit/${purchaseHistory.id}`, {
                  state: { returnPurchaseTab },
                })
              }
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CarIcon className="w-6 h-6 text-primary-600" />
              Car Information
            </h2>

            {(purchaseHistory.cars && purchaseHistory.cars.length > 0) ? (
              <div className="space-y-8">
                {purchaseHistory.cars.map((car, index) => (
                  <div key={car.id} className={`${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-gray-900">{car.make} {car.model}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Chassis Number
                        </label>
                        <p className="text-gray-900 font-medium">
                          {car.chassis_no_full || car.chassis_no_masked || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Year
                        </label>
                        <p className="text-gray-900 font-medium">
                          {car.year || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Color
                        </label>
                        <p className="text-gray-900 font-medium">
                          {car.color || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Reference Number
                        </label>
                        <p className="text-gray-900 font-medium">
                          {car.ref_no || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : purchaseHistory.car ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Car
                  </label>
                  <p className="text-gray-900 font-medium">
                    {purchaseHistory.car.make} {purchaseHistory.car.model}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Chassis Number
                  </label>
                  <p className="text-gray-900 font-medium">
                    {purchaseHistory.car.chassis_no_full || purchaseHistory.car.chassis_no_masked || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Year
                  </label>
                  <p className="text-gray-900 font-medium">
                    {purchaseHistory.car.year || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Color
                  </label>
                  <p className="text-gray-900 font-medium">
                    {purchaseHistory.car.color || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                No car associated with this purchase history.
              </p>
            )}
          </div>

          {/* Purchase Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary-600" />
              Purchase Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Foreign Amount
                </label>
                <p className="text-gray-900 font-medium">
                  {formatCurrency(purchaseHistory.foreign_amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  BDT Amount
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                  {formatCurrency(purchaseHistory.bdt_amount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Purchase Date
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(purchaseHistory.purchase_date)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Purchase Amount
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                  {formatCurrency(purchaseHistory.purchase_amount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Govt Duty
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.govt_duty || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  CNF Amount
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <CurrencyBDTIcon className="w-4 h-4 text-gray-400" />
                  {formatCurrency(purchaseHistory.cnf_amount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Miscellaneous
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.miscellaneous || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* LC Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              Letter of Credit (LC) Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  LC Date
                </label>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(purchaseHistory.lc_date)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  LC Number
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.lc_number || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Units per LC
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.total_units_per_lc || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  LC Bank Name
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.lc_bank_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  LC Bank Branch Name
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.lc_bank_branch_name || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  LC Bank Branch Address
                </label>
                <p className="text-gray-900 font-medium">
                  {purchaseHistory.lc_bank_branch_address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* PDF Documents */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              PDF Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfFields.map((field) => {
                const filePath = purchaseHistory[
                  field.key as keyof PurchaseHistory
                ] as string | null;
                const hasFile = !!filePath;

                return (
                  <div
                    key={field.key}
                    className={`border-2 rounded-xl p-4 ${hasFile
                        ? "border-primary-200 bg-white"
                        : "border-gray-200 bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {field.label}
                      </h3>
                      {hasFile && (
                        <FileCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {hasFile ? (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleViewPdf(filePath, field.key)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadPdf(
                              filePath,
                              field.key,
                              `${field.label.replace(/\s+/g, "_")}.pdf`
                            )
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        No file uploaded
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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
                  Car
                </label>
                <p className="text-gray-900 font-semibold">
                  {purchaseHistory.car
                    ? (() => {
                      const chassisNo = purchaseHistory.car.chassis_no_full || purchaseHistory.car.chassis_no_masked;
                      return `${purchaseHistory.car.make} ${purchaseHistory.car.model}${chassisNo ? ` (${chassisNo})` : ""}`;
                    })()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Record ID
                </label>
                <p className="text-gray-900 font-semibold">
                  #{purchaseHistory.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {formatDate(purchaseHistory.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {formatDate(purchaseHistory.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">Purchase Amount:</span>
                <span className="font-bold">
                  {formatCurrency(purchaseHistory.purchase_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">Govt Duty:</span>
                <span className="font-bold">
                  {formatCurrency(purchaseHistory.govt_duty)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">CNF Amount:</span>
                <span className="font-bold">
                  {formatCurrency(purchaseHistory.cnf_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-100 font-bold">Miscellaneous:</span>
                <span className="font-bold">
                  {formatCurrency(purchaseHistory.miscellaneous)}
                </span>
              </div>
              <div className="pt-3 border-t border-primary-400">
                <div className="flex justify-between">
                  <span className="text-primary-100 font-bold">Total:</span>
                  <span className="font-bold">
                    {formatCurrency(calculatedPurchaseAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Purchase History"
        message={`Are you sure you want to delete purchase history #${purchaseHistory.id}? This action cannot be undone and will delete all associated PDF files.`}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PurchaseHistoryDetails;
