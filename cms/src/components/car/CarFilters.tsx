import React from "react";
import { Search } from "lucide-react";
import { CarFilterOptions } from "../../services/carApi";
import { Category } from "../../services/categoryApi";

interface CarFiltersProps {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  makeFilter: string;
  yearFilter: string;
  transmissionFilter: string;
  fuelFilter: string;
  colorFilter: string;
  filterOptions: CarFilterOptions | null;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onMakeChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onTransmissionChange: (value: string) => void;
  onFuelChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onClearFilters: () => void;
}

const CarFilters: React.FC<CarFiltersProps> = ({
  searchTerm,
  statusFilter,
  categoryFilter,
  makeFilter,
  yearFilter,
  transmissionFilter,
  fuelFilter,
  colorFilter,
  filterOptions,
  categories,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onMakeChange,
  onYearChange,
  onTransmissionChange,
  onFuelChange,
  onColorChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
          />
        </div>

        {/* Status Filter */}
        {/* <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
        >
          <option value="">All Status</option>
          {filterOptions?.statuses?.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select> */}

        {/* Category Filter */}
        {/* <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select> */}

        {/* Make Filter */}
        {/* <select
          value={makeFilter}
          onChange={(e) => onMakeChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
        >
          <option value="">All Makes</option>
          {filterOptions?.makes?.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select> */}

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

export default CarFilters;
