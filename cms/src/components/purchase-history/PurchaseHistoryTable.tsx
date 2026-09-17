import React from "react";
import { FileText } from "lucide-react";
import { PurchaseHistory } from "../../services/purchaseHistoryApi";
import { CurrencyBDTIcon } from "../icons/CurrencyBDTIcon";
import PurchaseHistoryTableRow from "./PurchaseHistoryTableRow";

interface PurchaseHistoryTableProps {
  purchaseHistories: PurchaseHistory[];
  isLoading: boolean;
  onEdit: (purchaseHistory: PurchaseHistory) => void;
  onDelete: (purchaseHistory: PurchaseHistory) => void;
  onView?: (purchaseHistory: PurchaseHistory) => void;
  onRefresh: () => void;
}

const PurchaseHistoryTable: React.FC<PurchaseHistoryTableProps> = ({
  purchaseHistories,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-100 border-t-primary-600 mx-auto"></div>
        </div>
        <p className="text-gray-900 mt-4 font-medium">
          Loading purchase history...
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching the latest records
        </p>
      </div>
    );
  }

  if (purchaseHistories.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <FileText className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          No purchase histories found
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          We couldn&apos;t find any records matching your criteria. Try
          adjusting your filters or search terms.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl hover:from-primary-700 hover:to-primary-900 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Refresh Data
        </button>
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
              <div className="col-span-3">
                <span>Car Details</span>
              </div>
              <div className="col-span-2">
                <span>Purchase Date</span>
              </div>
              <div className="col-span-2">
                <span>Amount</span>
              </div>
              <div className="col-span-2">
                <span>LC Number</span>
              </div>
              <div className="col-span-1">
                <span>LC Bank</span>
              </div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {purchaseHistories.map((purchaseHistory) => (
              <PurchaseHistoryTableRow
                key={purchaseHistory.id}
                purchaseHistory={purchaseHistory}
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

export default PurchaseHistoryTable;
