import React from "react";
import { Search, X, Download, FileText, Plus, ChevronDown } from "lucide-react";
import { makeToModels } from "../../utils/carData";
import { STOCK_STATUS_DROPDOWN_OPTIONS } from "../../utils/stockStatus";

interface StockFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
  yearFilter: string;
  onYearFilterChange: (year: string) => void;
  makeFilter?: string;
  onMakeFilterChange?: (make: string) => void;
  modelFilter?: string;
  onModelFilterChange?: (model: string) => void;
  colorFilter: string;
  onColorFilterChange: (color: string) => void;
  fuelFilter: string;
  onFuelFilterChange: (fuel: string) => void;
  fromDateFilter?: string;
  onFromDateFilterChange?: (date: string) => void;
  toDateFilter?: string;
  onToDateFilterChange?: (date: string) => void;
  isGeneratingPDF: boolean;
  onGeneratePDF?: () => void;
  onCreateInvoice?: () => void;
  onCreateStock?: () => void;
  /** Pending tab: quick action to create a new car */
  onAddCar?: () => void;
  /** All Stock tab: narrow by workflow / inventory status */
  showStatusFilter?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  disableStatusFilter?: boolean;
  statusCounts?: Record<string, number>;
  filterOptions?: {
    years?: number[];
    colors?: string[];
    fuels?: string[];
  };
  searchPlaceholder?: string;
}

export const StockFilters: React.FC<StockFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onClearFilters,
  yearFilter,
  onYearFilterChange,
  makeFilter,
  onMakeFilterChange,
  modelFilter,
  onModelFilterChange,
  colorFilter,
  onColorFilterChange,
  fuelFilter,
  onFuelFilterChange,
  fromDateFilter = "",
  onFromDateFilterChange,
  toDateFilter = "",
  onToDateFilterChange,
  isGeneratingPDF,
  onGeneratePDF,
  onCreateInvoice,
  onCreateStock,
  onAddCar,
  showStatusFilter,
  statusFilter,
  onStatusFilterChange,
  disableStatusFilter = false,
  statusCounts,
  filterOptions,
  searchPlaceholder = "Search stocks by make, model, year, chassis number, or any keyword...",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [makeOpen, setMakeOpen] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(false);
  const [yearOpen, setYearOpen] = React.useState(false);

  const [statusSearch, setStatusSearch] = React.useState("");
  const [makeSearch, setMakeSearch] = React.useState("");
  const [modelSearch, setModelSearch] = React.useState("");
  const [yearSearch, setYearSearch] = React.useState("");

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const makeRef = React.useRef<HTMLDivElement>(null);
  const modelRef = React.useRef<HTMLDivElement>(null);
  const yearRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
        setStatusSearch("");
      }
      if (makeRef.current && !makeRef.current.contains(target)) {
        setMakeOpen(false);
        setMakeSearch("");
      }
      if (modelRef.current && !modelRef.current.contains(target)) {
        setModelOpen(false);
        setModelSearch("");
      }
      if (yearRef.current && !yearRef.current.contains(target)) {
        setYearOpen(false);
        setYearSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalCount = statusCounts
    ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
    : 0;
  const selectedOption = STOCK_STATUS_DROPDOWN_OPTIONS.find(
    (opt) => opt.value === statusFilter
  );
  const selectedCount = statusFilter
    ? statusCounts?.[statusFilter] || 0
    : totalCount;

  const hasActiveFilters =
    searchTerm ||
    yearFilter ||
    makeFilter ||
    modelFilter ||
    colorFilter ||
    fuelFilter ||
    fromDateFilter ||
    toDateFilter ||
    (showStatusFilter && !!statusFilter);

  return (
    <div className="mb-0">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-3 flex-grow lg:flex-1 w-full lg:w-auto">
          {/* Search Box */}
          {onSearchChange !== undefined && (
            <div className="relative flex-grow lg:flex-1 min-w-[280px] max-w-[800px] w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search stock by make, model, year, ref no..."}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>
          )}

          {/* Inventory status — All Stock tab */}
        {showStatusFilter &&
          statusFilter !== undefined &&
          onStatusFilterChange && (
          <div className="w-full lg:w-auto relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={disableStatusFilter}
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full lg:w-auto min-w-[190px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl font-semibold text-sm shadow-sm transition-all ${
                disableStatusFilter
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-primary-500"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedOption ? selectedOption.label : "All statuses"}
                </span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-800 rounded-full dark:bg-primary-900 dark:text-primary-200">
                  {selectedCount}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Search statuses..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto flex-1 max-h-48 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onStatusFilterChange("");
                      setIsOpen(false);
                      setStatusSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!statusFilter ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    <span>All statuses</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full dark:bg-gray-900 dark:text-gray-400">
                      {totalCount}
                    </span>
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  {STOCK_STATUS_DROPDOWN_OPTIONS
                    .filter(({ label }) => label.toLowerCase().includes(statusSearch.toLowerCase()))
                    .map(({ value, label }) => {
                      const count = statusCounts?.[value] || 0;
                      const isSelected = statusFilter === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            onStatusFilterChange(value);
                            setIsOpen(false);
                            setStatusSearch("");
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                          <span>{label}</span>
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${isSelected ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Make Filter */}
        <div className="w-full lg:w-auto relative" ref={makeRef}>
          <button
            type="button"
            onClick={() => setMakeOpen(!makeOpen)}
            className="w-full lg:w-auto min-w-[150px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 hover:border-gray-400 transition-all font-semibold text-sm shadow-sm"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {makeFilter || "All Makes"}
            </span>
            <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${makeOpen ? "rotate-180" : ""}`} />
          </button>

          {makeOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search makes..."
                  value={makeSearch}
                  onChange={(e) => setMakeSearch(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 max-h-48 py-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onMakeFilterChange) {
                      onMakeFilterChange("");
                      if (onModelFilterChange) onModelFilterChange("");
                    }
                    setMakeOpen(false);
                    setMakeSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!makeFilter ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  All Makes
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                {Object.keys(makeToModels)
                  .sort()
                  .filter((make) => make.toLowerCase().includes(makeSearch.toLowerCase()))
                  .map((make) => {
                    const isSelected = makeFilter === make;
                    return (
                      <button
                        key={make}
                        type="button"
                        onClick={() => {
                          if (onMakeFilterChange) {
                            onMakeFilterChange(make);
                            if (onModelFilterChange) onModelFilterChange("");
                          }
                          setMakeOpen(false);
                          setMakeSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                      >
                        {make}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Model Filter */}
        <div className="w-full lg:w-auto relative" ref={modelRef}>
          <button
            type="button"
            disabled={!makeFilter}
            onClick={() => setModelOpen(!modelOpen)}
            className={`w-full lg:w-auto min-w-[150px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all font-semibold text-sm shadow-sm ${!makeFilter ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 hover:border-gray-400'}`}
          >
            <span className={!makeFilter ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
              {modelFilter || "All Models"}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
          </button>

          {modelOpen && makeFilter && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 max-h-48 py-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onModelFilterChange) onModelFilterChange("");
                    setModelOpen(false);
                    setModelSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!modelFilter ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  All Models
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                {makeToModels[makeFilter]
                  ?.sort()
                  .filter((model) => model.toLowerCase().includes(modelSearch.toLowerCase()))
                  .map((model) => {
                    const isSelected = modelFilter === model;
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => {
                          if (onModelFilterChange) onModelFilterChange(model);
                          setModelOpen(false);
                          setModelSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                      >
                        {model}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Year Filter */}
        <div className="w-full lg:w-auto relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => setYearOpen(!yearOpen)}
            className="w-full lg:w-auto min-w-[150px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 hover:border-gray-400 transition-all font-semibold text-sm shadow-sm"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {yearFilter || "All Years"}
            </span>
            <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${yearOpen ? "rotate-180" : ""}`} />
          </button>

          {yearOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search years..."
                  value={yearSearch}
                  onChange={(e) => setYearSearch(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 max-h-48 py-1">
                <button
                  type="button"
                  onClick={() => {
                    onYearFilterChange("");
                    setYearOpen(false);
                    setYearSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!yearFilter ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  All Years
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                {filterOptions?.years
                  ?.filter((year) => year.toString().includes(yearSearch))
                  ?.map((year: number) => {
                    const isSelected = yearFilter === year.toString();
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          onYearFilterChange(year.toString());
                          setYearOpen(false);
                          setYearSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                      >
                        {year}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>



        {/* Color Filter */}
        {/* <div className="w-full lg:w-auto">
          <select
            value={colorFilter}
            onChange={(e) => onColorFilterChange(e.target.value)}
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
            onChange={(e) => onFuelFilterChange(e.target.value)}
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

        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
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

        {onAddCar && (
          <button
            type="button"
            onClick={onAddCar}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
            title="Add Stock List"
            aria-label="Add Stock List"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold text-white">Add Stock List</span>
          </button>
        )}

        {/* Download PDF Button */}
        {onGeneratePDF && (
          <button
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className={`flex items-center justify-center transition-colors font-medium shadow-sm ${isGeneratingPDF
              ? "w-auto px-4 py-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed gap-2"
              : "w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700"
              }`}
            title="Download PDF"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Create Invoice Button - Commented out */}
        {/* {onCreateInvoice && (
          <button
            onClick={onCreateInvoice}
            className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-sm"
            title="Create Invoice"
          >
            <FileText className="w-5 h-5" />
          </button>
        )} */}

        {/* Add Stock Button - Commented out */}
        {/* {onCreateStock && (
          <button
            onClick={onCreateStock}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            title="Add Stock"
          >
            <Plus className="w-5 h-5" />
            <span>Add Stock</span>
          </button>
        )} */}
      </div>
    </div>
  </div>
  );
};
