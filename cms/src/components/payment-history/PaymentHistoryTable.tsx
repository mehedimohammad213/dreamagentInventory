import React from "react";
import { Calendar, Car, FileText, Building2, User, CreditCard } from "lucide-react";
import { PaymentHistory } from "../../services/paymentHistoryApi";
import { CurrencyBDTIcon } from "../icons/CurrencyBDTIcon";
import PaymentHistoryTableRow from "./PaymentHistoryTableRow";

interface PaymentHistoryTableProps {
  paymentHistories: PaymentHistory[];
  isLoading: boolean;
  canManage?: boolean;
  onEdit: (paymentHistory: PaymentHistory) => void;
  onDelete: (paymentHistory: PaymentHistory) => void;
  onView?: (paymentHistory: PaymentHistory) => void;
  onRefresh: () => void;
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  paymentHistories,
  isLoading,
  canManage = false,
  onEdit,
  onDelete,
  onView,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading payment histories...</span>
          </div>
        </div>
      </div>
    );
  }

  if (paymentHistories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payment histories found
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            {isLoading
              ? "Loading..."
              : "Try refreshing the page or check your connection"}
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="overflow-x-auto overflow-y-visible no-horizontal-scrollbar">
        <div className="min-w-[1200px]">
          {/* Table Header - aligned with Stock page theme */}
          <div className="bg-primary-100 border-b border-primary-200 text-primary-800">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-3">Car Details</div>
              <div className="col-span-2">Showroom</div>
              <div className="col-span-1">Selling Date</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2">Installments</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body matching CarTable style */}
          <div className="divide-y divide-gray-100">
            {paymentHistories.map((paymentHistory) => (
              <PaymentHistoryTableRow
                key={paymentHistory.id}
                paymentHistory={paymentHistory}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
