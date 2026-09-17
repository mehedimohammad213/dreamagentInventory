import React from "react";
import { Search, Download, Plus, Filter, Car, X } from "lucide-react";
import { makeToModels } from "../../utils/carData";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  makeFilter: string;
  setMakeFilter: (make: string) => void;
  modelFilter: string;
  setModelFilter: (model: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  transmissionFilter: string;
  setTransmissionFilter: (transmission: string) => void;
  colorFilter: string;
  setColorFilter: (color: string) => void;
  fuelFilter: string;
  setFuelFilter: (fuel: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  isGeneratingPDF: boolean;
  onGeneratePDF: () => void;
  onClearFilters: () => void;
  onAddCar?: () => void;
  isAdmin?: boolean;
  filterOptions: any;
  categories: Array<{ id: number; name: string }>;
}

const SearchFilters: React.FC<SearchFiltersProps> = (props) => {
  const {
    searchTerm,
    setSearchTerm,
    makeFilter,
    setMakeFilter,
    modelFilter,
    setModelFilter,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    statusFilter,
    setStatusFilter,
    transmissionFilter,
    setTransmissionFilter,
    colorFilter,
    setColorFilter,
    fuelFilter,
    setFuelFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    isGeneratingPDF,
    onGeneratePDF,
    onClearFilters,
    onAddCar,
    isAdmin,
    filterOptions,
    categories,
  } = props;

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    yearFilter ||
    colorFilter ||
    fuelFilter ||
    makeFilter ||
    modelFilter ||
    statusFilter ||
    categoryFilter ||
    transmissionFilter;

  return (
    <>
      {/* Header */}
      <div className="p-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">
              Cars / Car List
            </h1>
            {/* <p className="text-sm text-gray-500 mt-1">
              Manage and explore your vehicle fleet
            </p> */}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cars by make, model, year, chassis number, or any keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Make Filter */}
          <div className="w-full lg:w-auto">
            <select
              value={makeFilter}
              onChange={(e) => {
                setMakeFilter(e.target.value);
                setModelFilter(""); // Reset model when make changes
              }}
              className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Makes</option>
              {Object.keys(makeToModels).sort().map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {/* Model Filter */}
          <div className="w-full lg:w-auto">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              disabled={!makeFilter}
              className={`w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${!makeFilter ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}
            >
              <option value="">All Models</option>
              {makeFilter && makeToModels[makeFilter]?.sort().map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="w-full lg:w-auto">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Years</option>
              {filterOptions?.years?.map((year: number) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          {/* <div className="w-full lg:w-auto">
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent capitalize"
            >
              <option value="">All Colors</option>
              {filterOptions?.colors?.map((color: string) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div> */}

          {/* Fuel Type Filter */}
          {/* <div className="w-full lg:w-auto">
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="w-full lg:w-auto min-w-[150px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent capitalize"
            >
              <option value="">All Fuel Types</option>
              {filterOptions?.fuels?.map((fuel: string) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div> */}

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

          {/* Add Car Button - Moved here */}
          {isAdmin && onAddCar && (
            <button
              onClick={onAddCar}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add New Car
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchFilters;
