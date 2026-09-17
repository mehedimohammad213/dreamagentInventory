import React from "react";
import { useNavigate } from "react-router-dom";
import { Car, ArrowLeft } from "lucide-react";
import { Car as CarType } from "../../services/carApi";
import { getStatusColor } from "../../utils/carUtils";

interface CarViewHeaderProps {
  car: CarType;
  isAdmin: boolean;
  getBackRoute: () => string;
  disableBack?: boolean;
}

const CarViewHeader: React.FC<CarViewHeaderProps> = ({
  car,
  isAdmin,
  getBackRoute,
  disableBack = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <button
        disabled={disableBack}
        onClick={() => {
          if (!disableBack) {
            navigate(getBackRoute());
          }
        }}
        className={`flex items-center gap-2 mb-3 sm:mb-4 transition-colors ${
          disableBack
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Dream Agent Car Vision</span>
      </button>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {car.year} {car.make} {car.model}
            {car.variant && ` - ${car.variant}`}
          </h1>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                car.status
              )}`}
            >
              {(car.status?.replace(/_/g, " ") || "N/A").toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarViewHeader;
