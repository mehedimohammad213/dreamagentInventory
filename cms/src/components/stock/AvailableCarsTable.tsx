import React from "react";
import { Car, Eye, Edit, PackagePlus } from "lucide-react";
import { getCssColor, getGradeColor } from "../../utils/carUtils";
import { getEffectiveStatusForUnifiedRow } from "../../utils/stockStatus";
import StockActionsDropdown from "./StockActionsDropdown";
import { StockStatusBadges } from "./StockStatusBadges";

interface AvailableCar {
  id: number;
  make: string;
  model: string;
  year: number;
  mileage_km?: number;
  engine_cc?: number;
  color?: string;
  grade_overall?: string;
  keys_feature?: string;
  price_amount?: string | number;
  ref_no?: string;
  chassis_no_full?: string;
  chassis_no_masked?: string;
  status?: string;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
  package?: string;
  photos?: Array<{
    id: number;
    url: string;
    is_primary: boolean;
  }>;
}

interface AvailableCarsTableProps {
  /** Current page of rows (after search/filters/pagination). */
  cars: AvailableCar[];
  /** Full filtered list (all pages) for counts and empty states. */
  filteredAllCars: AvailableCar[];
  /** True once load finished and API returned at least one car (before client filters). */
  apiHasCars: boolean;
  /** Cars from API with no stock row (pending pool size before search/filters). */
  sourceCount: number;
  isLoading: boolean;
  onCreateStock: (car: AvailableCar) => void;
  onRefresh: () => void;
  onView?: (car: AvailableCar) => void;
  onEdit?: (car: AvailableCar) => void;
  onDelete?: (car: AvailableCar) => void;
}

const AvailableCarsTable: React.FC<AvailableCarsTableProps> = ({
  cars,
  filteredAllCars,
  apiHasCars,
  sourceCount,
  isLoading,
  onCreateStock,
  onRefresh,
  onView,
  onEdit,
}) => {
  const availableCarsCountMap = React.useMemo(() => {
    const counts = new Map<string, number>();
    filteredAllCars.forEach((car) => {
      const key = `${car.make || "Unknown"}_${car.model || "Unknown"}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [filteredAllCars]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-100 border-t-primary-600 mx-auto"></div>
        </div>
        <p className="text-gray-900 mt-4 font-medium">
          Loading available cars...
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching the latest vehicle details
        </p>
      </div>
    );
  }

  if (!apiHasCars) {
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Car className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          No pending cars
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          All cars have stock entries. Try refreshing the page or check your connection.
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

  if (sourceCount === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Car className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          No pending cars
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          There are no cars waiting to be added to stock, or all listed cars are marked sold.
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

  if (filteredAllCars.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Car className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          No matches
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          No pending cars match your search or filters. Try clearing filters or using different keywords.
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
        <div className="min-w-[1200px] sm:min-w-full">
          {/* Table Header - project primary theme color */}
          <div className="bg-primary-100 border-b border-primary-200 text-primary-800">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-2">
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
              <div className="col-span-2">
                <span>Key Features</span>
              </div>
              <div className="col-span-1">
                <span>Price</span>
              </div>
              <div className="col-span-1 text-center">
                <span>Available Cars</span>
              </div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body with Enhanced Styling */}
          <div className="divide-y divide-gray-100">
            {cars.map((car, index) => {
              const effectiveStatus = getEffectiveStatusForUnifiedRow({
                kind: "pending",
                car,
              });
              const carSold = effectiveStatus === "sold";
              const makeModelKey = `${car.make}_${car.model}`;
              const availableCarsCount = availableCarsCountMap.get(makeModelKey) || 0;

              const isFirstOfMakeModel =
                cars.findIndex(
                  (c) => `${c.make}_${c.model}` === makeModelKey
                ) === index;

              const refNo =
                car.ref_no ||
                (car.id != null
                  ? `AA${car.id.toString().padStart(6, "0")}`
                  : "N/A");
              const chassisNo =
                car.chassis_no_full || car.chassis_no_masked || "N/A";

              const keyFeatures = car?.keys_feature
                ? car.keys_feature
                    .split(",")
                    .map((feature: string) => feature.trim())
                    .filter(Boolean)
                : [];

              return (
                <div
                  key={car.id}
                  onClick={() => onView?.(car)}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
                >
                  {/* Left accent bar on hover - same as CarTable */}
                  <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />
                  {/* Car Information - Enhanced */}
                  <div className="col-span-2 flex items-center gap-3">
                    {/*
                      Car image (hidden). Uncomment to show vehicle thumbnail again.
                      Kept commented for future reuse.
                    */}
                    {/*
                      <div className="relative w-28 h-24 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 group-hover:border-blue-300">
                        {car.photos && car.photos.length > 0 ? (
                          <img
                            src={
                              car.photos.find((p: any) => p.is_primary)?.url ||
                              car.photos[0].url
                            }
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Car className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                    */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                        {car.year} {car.make} {car.model}
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
                        <StockStatusBadges effectiveStatus={effectiveStatus} />
                        {car.category && (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                            {car.category.name}
                          </span>
                        )}
                        {car.package && (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                            {car.package}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mileage - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {car.mileage_km
                        ? `${car.mileage_km.toLocaleString()} km`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Engine - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {car.engine_cc
                          ? `${car.engine_cc.toLocaleString()} cc`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Color - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center gap-2">
                      {car.color && (
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
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

                  {/* Grade - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col items-start gap-1">
                      {car.grade_overall ? (
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-md ${getGradeColor(
                            car.grade_overall
                          )}`}
                        >
                          {car.grade_overall}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Key Features - Enhanced */}
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-1.5 max-w-full">
                      {keyFeatures.map((feature: string) => (
                        <span
                          key={feature}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {feature}
                        </span>
                      ))}
                      {keyFeatures.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No features listed</span>
                      )}
                    </div>
                  </div>

                  {/* Price - Enhanced */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {car.price_amount
                        ? `৳ ${typeof car.price_amount === "string"
                          ? parseFloat(car.price_amount).toLocaleString("en-IN")
                          : car.price_amount.toLocaleString("en-IN")
                        }`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Available Cars Count */}
                  <div className="col-span-1 flex items-center justify-center">
                    {isFirstOfMakeModel ? (
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold min-w-[60px]">
                        {availableCarsCount}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">-</span>
                    )}
                  </div>

                  {/* Actions — same ⋮ menu as All Stock / Current */}
                  <div
                    className="col-span-2 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StockActionsDropdown
                      items={[
                        ...(onView
                          ? [
                              {
                                id: "view",
                                label: "View",
                                icon: Eye,
                                onClick: () => onView(car),
                                variant: "primary" as const,
                              },
                            ]
                          : []),
                        ...(onEdit
                          ? [
                              {
                                id: "edit",
                                label: "Edit",
                                icon: Edit,
                                onClick: () => onEdit(car),
                                variant: "amber" as const,
                              },
                            ]
                          : []),
                        {
                          id: "add-stock",
                          label: carSold
                            ? "Add stock (restock)"
                            : "Add stock",
                          icon: PackagePlus,
                          onClick: () => onCreateStock(car),
                          variant: "primary" as const,
                        },
                      ]}
                    />
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

export default AvailableCarsTable;
