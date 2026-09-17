import React, { useState, useEffect } from "react";
import { Car, Gauge, Settings, Palette, Award, Tag, Package } from "lucide-react";
import { carApi, Car as CarType } from "../../services/carApi";
import { stockApi, Stock } from "../../services/stockApi";
import { CurrencyBDTIcon } from "../icons/CurrencyBDTIcon";
import {
  getGradeColor,
  formatPrice as formatPriceUtil,
  getCssColor,
} from "../../utils/carUtils";

const TotalStockTable: React.FC = () => {
  const [cars, setCars] = useState<CarType[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  type AvailableCarCount = { make: string; model: string };
  const [availableCars, setAvailableCars] = useState<AvailableCarCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTotalStock();
  }, []);

  const fetchTotalStock = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [carsResponse, stocksResponse, availableCarsResponse] = await Promise.all([
        // Fetch all cars with pagination
        (async () => {
          let allCars: CarType[] = [];
          let currentPage = 1;
          let lastPage = 1;

          do {
            const response = await carApi.getCars({
              per_page: 100,
              page: currentPage,
            });

            if (response.success && response.data) {
              const carsData = response.data.data || response.data.cars || [];
              allCars = [...allCars, ...carsData];

              if (response.data.last_page) {
                lastPage = response.data.last_page;
              } else if (response.data.pagination) {
                lastPage = response.data.pagination.last_page;
              } else {
                lastPage = 1;
              }
            }
            currentPage++;
          } while (currentPage <= lastPage);

          return allCars;
        })(),
        // Fetch all stocks
        stockApi.getStocks({ per_page: 10000, page: 1 }),
        // Fetch available cars
        stockApi.getAvailableCars(),
      ]);

      // Process cars
      const allCars = [...carsResponse];
      allCars.sort((a, b) => {
        if (a.make !== b.make) {
          return a.make.localeCompare(b.make);
        }
        if (a.model !== b.model) {
          return a.model.localeCompare(b.model);
        }
        return (b.year || 0) - (a.year || 0);
      });

      // Process stocks
      const stocksData = stocksResponse.success ? stocksResponse.data || [] : [];

      // Process available cars
      const availableCarsData = availableCarsResponse.success
        ? availableCarsResponse.data || []
        : [];

      setCars(allCars);
      setStocks(stocksData);
      setAvailableCars(
        (availableCarsData as Array<{ make?: string; model?: string }>).map((c) => ({
          make: c.make || "",
          model: c.model || "",
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch total stock";
      console.error("Error fetching total stock:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null) return "Price on request";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "Price on request";
    const formatted = formatPriceUtil(numAmount, currency);
    return formatted.replace(/^[A-Z]+\s/, "");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading total stock...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">{error}</p>
          <button
            onClick={fetchTotalStock}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Car className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No cars found
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            There are no cars in the system.
          </p>
          <button
            onClick={fetchTotalStock}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto no-horizontal-scrollbar">
        <div className="min-w-[1200px] sm:min-w-full">
          {/* Professional Table Header with Gradient */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-primary-800 shadow-lg">
            <div className="grid grid-cols-12 gap-4 p-5 text-sm font-bold text-white uppercase tracking-wider">
              <div className="col-span-2 flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span>Car Information</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                <span>Mileage</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Engine</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Color</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Grade</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Key Features</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <CurrencyBDTIcon className="w-4 h-4" />
                <span>Price</span>
              </div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 flex items-center gap-2 justify-center">
                <Package className="w-4 h-4" />
                <span>Total Count</span>
              </div>
              <div className="col-span-1 flex items-center gap-2 justify-center">
                <Package className="w-4 h-4" />
                <span>Current Stock</span>
              </div>
              <div className="col-span-1 flex items-center gap-2 justify-center">
                <Package className="w-4 h-4" />
                <span>Available Cars</span>
              </div>
            </div>
          </div>

          {/* Table Body with Enhanced Styling */}
          <div className="divide-y divide-gray-100 bg-gray-50/30">
            {cars.map((car, index) => {
              // Calculate count for this make/model combination
              const makeModelKey = `${car.make}_${car.model}`;
              const makeModelCount = cars.filter(
                (c) => `${c.make}_${c.model}` === makeModelKey
              ).length;

              const refNo =
                car?.ref_no ||
                (car?.id != null
                  ? `AA${car.id.toString().padStart(6, "0")}`
                  : "N/A");
              const chassisNo =
                car?.chassis_no_full || car?.chassis_no_masked || "N/A";

              const keyFeatures = car?.keys_feature
                ? car.keys_feature
                    .split(",")
                    .map((feature: string) => feature.trim())
                    .filter(Boolean)
                : [];

              // Calculate current stock count for this make/model
              const currentStockCount = stocks.filter(
                (stock) => stock.car && `${stock.car.make}_${stock.car.model}` === makeModelKey
              ).length;

              // Calculate available cars count for this make/model
              const availableCarsCount = availableCars.filter(
                (availableCar) => `${availableCar.make}_${availableCar.model}` === makeModelKey
              ).length;

              // Only show count on first occurrence of each make/model
              const isFirstOfMakeModel = cars.findIndex(
                (c) => `${c.make}_${c.model}` === makeModelKey
              ) === index;

              return (
              <div
                key={car.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/30 transition-all duration-300 cursor-pointer group border-l-4 border-transparent hover:border-purple-500"
              >
                {/* Car Information - Enhanced */}
                <div className="col-span-2 flex items-center gap-3">
                  {/*
                    Car image (hidden). Uncomment to show vehicle thumbnail again.
                    Kept commented for reuse in future UI tweaks.
                  */}
                  {/*
                    <div className="relative w-28 h-24 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 group-hover:border-purple-300">
                      {car?.photos && car.photos.length > 0 ? (
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
                    <div className="text-base font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                      {car?.year} {car?.make} {car?.model}
                      {car?.variant && (
                        <span className="text-sm font-normal text-gray-600">
                          {" "}- {car.variant}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      <span className="text-gray-500">Ref:</span>{" "}
                      <span
                        className="text-purple-600 font-mono break-all"
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
                      {car?.package && (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {car.package}
                        </span>
                      )}
                      {car?.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                          {car.category.name}
                          {car.subcategory && ` / ${car.subcategory.name}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mileage - Enhanced */}
                <div className="col-span-1 flex items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {car?.mileage_km
                        ? `${car.mileage_km.toLocaleString()} km`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Engine - Enhanced */}
                <div className="col-span-1 flex items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {car?.engine_cc
                        ? `${car.engine_cc.toLocaleString()} cc`
                        : "N/A"}
                    </span>
                    {car?.fuel && (
                      <span className="text-xs text-gray-500 mt-0.5 capitalize">
                        {car.fuel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Color - Enhanced */}
                <div className="col-span-1 flex items-center">
                  <div className="flex items-center gap-2">
                    {car?.color && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm bg-gray-200"
                        style={{
                          backgroundColor: getCssColor(car.color),
                        }}
                        title={car.color}
                      />
                    )}
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {car?.color || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Grade - Enhanced */}
                <div className="col-span-1 flex items-center">
                  <div className="flex flex-col items-start gap-1">
                    {car?.grade_overall && (
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-md ${getGradeColor(
                          car.grade_overall
                        )}`}
                      >
                        {car.grade_overall}
                      </span>
                    )}
                    <div className="flex gap-1 text-xs">
                      {car?.grade_exterior && (
                        <span className="text-gray-600 font-medium">
                          E:{car.grade_exterior}
                        </span>
                      )}
                      {car?.grade_interior && (
                        <span className="text-gray-600 font-medium">
                          I:{car.grade_interior}
                        </span>
                      )}
                    </div>
                    {!car?.grade_overall &&
                      !car?.grade_exterior &&
                      !car?.grade_interior && (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                  </div>
                </div>

                {/* Key Features - Enhanced */}
                <div className="col-span-1 flex items-center">
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
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {car?.price_amount
                        ? formatPrice(car.price_amount, car.price_currency)
                        : "Price on request"}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center justify-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                      car.status === "available"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : car.status === "sold"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : car.status === "reserved"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {car.status || "N/A"}
                  </span>
                </div>

                {/* Total Count */}
                <div className="col-span-1 flex items-center justify-center">
                  {isFirstOfMakeModel ? (
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-bold min-w-[60px]">
                      {makeModelCount}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">-</span>
                  )}
                </div>

                {/* Current Stock Count */}
                <div className="col-span-1 flex items-center justify-center">
                  {isFirstOfMakeModel ? (
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold min-w-[60px]">
                      {currentStockCount}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">-</span>
                  )}
                </div>

                {/* Available Cars Count */}
                <div className="col-span-1 flex items-center justify-center">
                  {isFirstOfMakeModel ? (
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-bold min-w-[60px]">
                      {availableCarsCount}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">-</span>
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

export default TotalStockTable;
