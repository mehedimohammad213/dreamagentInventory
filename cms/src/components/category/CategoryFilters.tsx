import React from "react";
import { Search } from "lucide-react";

interface CategoryFiltersProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  searchTerm,
  statusFilter,
  typeFilter,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Types</option>
          <option value="parent">Parent Categories</option>
          <option value="child">Child Categories</option>
        </select>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default CategoryFilters;
