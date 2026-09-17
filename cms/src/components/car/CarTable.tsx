import React from "react";
import { Car, Eye, ShoppingCart, Edit, Trash2, Gauge, Settings, Palette, Award, Tag } from "lucide-react";
import { Car as CarType } from "../../services/carApi";
import { Stock } from "../../services/stockApi";
import { CurrencyBDTIcon } from "../icons/CurrencyBDTIcon";
import { getCssColor } from "../../utils/carUtils";

interface CarTableProps {
  cars: CarType[];
  stockData: Map<number, Stock>;
  onViewCar: (car: CarType) => void;
  onAddToCart: (car: CarType) => void;
  onEditCar?: (car: CarType) => void;
  onDeleteCar?: (car: CarType) => void;
  isCarLoading: (carId: number) => boolean;
  getStatusColor: (status: string) => string;
  getGradeColor: (grade?: string | number) => string;
  getStockStatusColor: (quantity: number, status: string) => string;
  formatPrice: (amount?: number, currency?: string) => string;
  isAdmin?: boolean;
}

const CarTable: React.FC<CarTableProps> = ({
  cars,
  stockData,
  onViewCar,
  onAddToCart,
  onEditCar,
  onDeleteCar,
  isCarLoading,
  getStatusColor,
  getGradeColor,
  getStockStatusColor,
  formatPrice,
  isAdmin = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto no-horizontal-scrollbar">
        <div className="min-w-[1200px]">
          {/* Clean Professional Table Header */}
          <div className="bg-gray-200 border-b border-gray-300 text-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-3">
                <span>Car Information</span>
              </div>
              <div className="col-span-1">
                <span>Mileage</span>
              </div>
              <div className="col-span-1">
                <span>Engine</span>
              </div>
              <div className="col-span-1">
                <span>Color</span>
              </div>
              <div className="col-span-1">
                <span>Grade</span>
              </div>
              <div className="col-span-3">
                <span>Key Features</span>
              </div>
              <div className="col-span-1">
                <span>Price</span>
              </div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {cars.map((car, index) => {
              const stock = stockData.get(car.id);
              const refNo =
                car.ref_no ||
                (car.id != null
                  ? `AA${car.id.toString().padStart(6, "0")}`
                  : "N/A");
              const chassisNo =
                car.chassis_no_full || car.chassis_no_masked || "N/A";
              return (
                <div
                  key={car.id}
                  onClick={() => onViewCar(car)}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
                >
                  {/* Left Side Highlight Stick */}
                  <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />
                  {/* Car Information */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative w-28 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-primary-300 transition-colors">
                      {car.photos && car.photos.length > 0 ? (
                        <img
                          src={
                            car.photos.find((p: any) => p.is_primary)?.url ||
                            car.photos[0].url
                          }
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      {stock && stock.quantity > 0 && (
                        <div className="absolute top-1 right-1 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {stock.quantity}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                        {car.year} {car.make} {car.model}
                        {car.variant && (
                          <span className="text-sm font-normal text-gray-600">
                            {" "}- {car.variant}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        <span className="text-gray-500">Ref:</span>{" "}
                        <span
                          className="text-primary-600 font-mono break-all"
                          title={refNo}
                        >
                          {refNo}
                        </span>
                      </div>
                      <div
                        className="text-xs text-gray-500 mb-2 font-mono break-all"
                        title={chassisNo}
                      >
                        <span className="text-gray-400">Chassis:</span>{" "}
                        {chassisNo}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${getStatusColor(
                            car.status
                          )}`}
                        >
                          {car.status?.charAt(0).toUpperCase() + car.status?.slice(1)}
                        </span>
                        {car.package && (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                            {car.package}
                          </span>
                        )}
                        {/* {stock && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${stock.quantity === 0
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : stock.quantity <= 2
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-green-100 text-green-700 border border-green-200"
                              }`}
                          >
                            Stock: {stock.quantity}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>

                  {/* Mileage - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {car.mileage_km
                          ? `${car.mileage_km.toLocaleString()} km`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Engine - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {car.engine_cc
                          ? `${car.engine_cc.toLocaleString()} cc`
                          : "N/A"}
                      </span>
                      {car.fuel && (
                        <span className="text-xs text-gray-500 mt-0.5 capitalize">
                          {car.fuel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Color - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center gap-2">
                      {car.color && (
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm bg-gray-200"
                          style={{
                            backgroundColor: getCssColor(car.color),
                          }}
                          title={car.color}
                        />
                      )}
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {car.color || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Grade */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col items-start gap-1">
                      {car.grade_overall && (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${getGradeColor(
                            car.grade_overall
                          )}`}
                        >
                          Grade: {car.grade_overall}
                        </span>
                      )}
                      <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                        {car.grade_exterior && (
                          <span>Ext: {car.grade_exterior}</span>
                        )}
                        {car.grade_interior && (
                          <span>Int: {car.grade_interior}</span>
                        )}
                      </div>
                      {!car.grade_overall &&
                        !car.grade_exterior &&
                        !car.grade_interior && (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="col-span-3 flex items-center">
                    <div className="flex flex-wrap gap-1 max-w-full">
                      {(car.keys_feature
                        ?.split(",")
                        .map((feature) => feature.trim())
                        .filter(Boolean) || []
                      ).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200"
                        >
                          {feature}
                        </span>
                      ))}
                      {!car.keys_feature && (
                        <span className="text-[10px] text-gray-400 italic">No features</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {car.price_amount
                          ? formatPrice(car.price_amount, car.price_currency)
                          : "On Request"}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Enhanced */}
                  <div
                    className="col-span-1 flex items-center justify-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onViewCar(car)}
                      className="p-2.5 text-primary-600 hover:text-primary-700 rounded-lg transition-all duration-200 group/btn"
                      title={
                        isAdmin ? "View Car Details (Admin)" : "View Car Details"
                      }
                    >
                      <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </button>

                    {/* Edit button for admin */}
                    {isAdmin && onEditCar && (
                      <button
                        onClick={() => onEditCar(car)}
                        className="p-2.5 text-amber-600 hover:text-amber-700 rounded-lg transition-all duration-200 group/btn"
                        title="Edit Car"
                      >
                        <Edit className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}

                    {/* Delete button for admin */}
                    {isAdmin && onDeleteCar && (
                      <button
                        onClick={() => onDeleteCar(car)}
                        className="p-2.5 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 group/btn"
                        title="Delete Car"
                      >
                        <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}

                    {/* Add to Cart button - hidden for admin */}
                    {!isAdmin && (
                      <button
                        onClick={() => onAddToCart(car)}
                        disabled={isCarLoading(car.id)}
                        className="p-2.5 text-green-600 hover:text-green-700 rounded-lg transition-all duration-200 disabled:text-gray-400 disabled:cursor-not-allowed group/btn"
                        title="Add to Cart"
                      >
                        {isCarLoading(car.id) ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                        ) : (
                          <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarTable;
