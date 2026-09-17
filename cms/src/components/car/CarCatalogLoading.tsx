import React from "react";
import { Car } from "lucide-react";

const CarCatalogLoading: React.FC = () => {
  return (
    <div className="text-center py-20">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-100 border-t-primary-600 mx-auto"></div>
      </div>
      <p className="text-gray-900 mt-4 font-medium">
        Loading inventory...
      </p>
      <p className="text-gray-500 text-sm mt-1">
        Fetching the latest vehicle details
      </p>
    </div>
  );
};

export default CarCatalogLoading;
