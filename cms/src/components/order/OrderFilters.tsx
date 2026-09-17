import React from "react";
import { Search, X } from "lucide-react";

interface OrderFiltersProps {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDateFilterChange: (date: string) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
];

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  statusFilter,
  dateFilter,
  onSearchChange,
  onStatusFilterChange,
  onDateFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = searchTerm || (statusFilter && statusFilter !== "all") || dateFilter;

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Search */}
        <div className="flex-1 relative w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        {dateFilter && (
          <div className="w-full lg:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
            title="Clear Filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
