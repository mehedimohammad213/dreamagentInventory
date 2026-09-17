import React from "react";
import { Car, X } from "lucide-react";

interface CarCatalogEmptyProps {
  onClearFilters: () => void;
}

const CarCatalogEmpty: React.FC<CarCatalogEmptyProps> = ({ onClearFilters }) => {
  return (
    <div className="text-center py-20">
      <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
        <Car className="w-20 h-20 text-primary-600" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">
        No vehicles found
      </h3>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
        We couldn't find any vehicles matching your criteria. Try
        adjusting your filters or search terms to discover more options.
      </p>
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl hover:from-primary-700 hover:to-primary-900 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <X className="w-5 h-5" />
        Clear All Filters
      </button>
    </div>
  );
};

export default CarCatalogEmpty;
