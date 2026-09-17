import React from "react";
import { Pencil, Trash2, Eye, Download } from "lucide-react";
import { PaymentHistory } from "../../services/paymentHistoryApi";
import StockActionsDropdown from "../stock/StockActionsDropdown";
import { PaymentHistoryInvoiceService } from "../../services/paymentHistoryInvoiceService";

interface PaymentHistoryTableRowProps {
  paymentHistory: PaymentHistory;
  canManage?: boolean;
  onEdit: (paymentHistory: PaymentHistory) => void;
  onDelete: (paymentHistory: PaymentHistory) => void;
  onView?: (paymentHistory: PaymentHistory) => void;
}

const PaymentHistoryTableRow: React.FC<PaymentHistoryTableRowProps> = ({
  paymentHistory,
  canManage = false,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const carDisplay = paymentHistory.car
    ? `${paymentHistory.car.make} ${paymentHistory.car.model}`
    : "N/A";

  const customerDisplay = paymentHistory.contact_number || "N/A";
  const customerEmail = paymentHistory.email || null;

  const installmentsCount = paymentHistory.installments?.length || 0;

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
      onClick={(e) => {
        // Only navigate if clicking on the row, not on buttons
        if ((e.target as HTMLElement).closest("button")) return;
        if (onView) onView(paymentHistory);
      }}
    >
      {/* Left Side Highlight Stick */}
      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />

      {/* Car Details */}
      <div className="col-span-3 flex items-start pt-1">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
            {carDisplay}
          </div>
          {paymentHistory.car && (paymentHistory.car.chassis_no_full || paymentHistory.car.chassis_no_masked) && (
            <div className="text-xs text-gray-500 mt-0.5 font-mono">
              Chassis: {paymentHistory.car.chassis_no_full || paymentHistory.car.chassis_no_masked}
            </div>
          )}
        </div>
      </div>

      {/* Showroom Name */}
      <div className="col-span-2 flex items-start pt-1">
        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
          {paymentHistory.showroom_name || "N/A"}
        </span>
      </div>

      {/* Selling Date */}
      <div className="col-span-1 flex items-start pt-1">
        <span className="text-xs font-semibold text-gray-600">
          {formatDate(paymentHistory.purchase_date)}
        </span>
      </div>

      {/* Selling Amount */}
      <div className="col-span-1 flex items-start pt-1">
        <span className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
          {formatCurrency(paymentHistory.purchase_amount)}
        </span>
      </div>

      {/* Customer */}
      <div className="col-span-2 flex items-start pt-1">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800">
            {customerDisplay}
          </div>
          {customerEmail && (
            <div className="text-[10px] text-gray-500 mt-0.5 truncate italic">
              {customerEmail}
            </div>
          )}
        </div>
      </div>

      {/* Installments */}
      <div className="col-span-2 flex items-start py-1">
        <div className="w-full">
          {installmentsCount > 0 ? (
            <div className="max-h-32 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
              {paymentHistory.installments?.map((ins) => (
                <div key={ins.id} className="flex items-start justify-between gap-2 text-xs border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-700">
                      {formatDate(ins.installment_date)}
                    </div>
                  </div>
                  <div className="text-right min-w-[70px] text-primary-700 font-bold">
                    {formatCurrency(ins.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">No installments</span>
          )}
        </div>
      </div>

      {/* Actions — ⋮ menu */}
      <div
        className="col-span-1 flex items-start justify-center pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <StockActionsDropdown
          items={[
            ...(onView
              ? [
                  {
                    id: "view",
                    label: "View",
                    icon: Eye,
                    onClick: () => onView(paymentHistory),
                    variant: "primary" as const,
                  },
                ]
              : []),
            ...(canManage
              ? [
                  {
                    id: "edit",
                    label: "Edit",
                    icon: Pencil,
                    onClick: () => onEdit(paymentHistory),
                    variant: "amber" as const,
                  },
                  {
                    id: "delete",
                    label: "Delete",
                    icon: Trash2,
                    onClick: () => onDelete(paymentHistory),
                    variant: "danger" as const,
                  },
                ]
              : []),
            {
              id: "download",
              label: "Download PDF",
              icon: Download,
              onClick: () =>
                PaymentHistoryInvoiceService.generateSalesTrackingReport(
                  paymentHistory
                ),
              variant: "success" as const,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default PaymentHistoryTableRow;
