"use client";

import React from "react";
import { SlidersHorizontal, MapPin, Boxes } from "lucide-react";
import { Car as CarType } from "../../services/carApi";
import { Stock } from "../../services/stockApi";
import {
  getStatusColor,
} from "../../utils/carUtils";

interface CarSpecificationsProps {
  car: CarType;
  stockData: Stock | null;
}

const CarSpecifications: React.FC<CarSpecificationsProps> = ({
  car,
  stockData,
}) => {
  const carExtras = car as CarType & {
    drive_type?: string;
    drivetrain?: string;
    port?: string;
    chassis_no?: string;
  };

  const specificationItems: Array<{
    label: string;
    value: React.ReactNode;
  }> = [
      {
        label: "Mileage",
        value: car.mileage_km
          ? `${car.mileage_km.toLocaleString()} km`
          : "N/A",
      },
      {
        label: "Year",
        value: car.year || "N/A",
      },
      {
        label: "Engine(CC)",
        value: car.engine_cc
          ? `${car.engine_cc.toLocaleString()} cc`
          : "N/A",
      },
      {
        label: "Transmission",
        value: car.transmission || "N/A",
      },
      {
        label: "Drivetrain",
        value: carExtras.drive_type || carExtras.drivetrain || "N/A",
      },
      {
        label: "Steering",
        value: car.steering || "N/A",
      },
      {
        label: "Fuel",
        value: car.fuel || "N/A",
      },
      {
        label: "Reference No.",
        value: car.ref_no || `AA${car.id.toString().padStart(6, "0")}`,
      },
      {
        label: "Registration Year",
        value: car.reg_year_month || "N/A",
      },
      {
        label: "Exterior Color",
        value: car.color || "N/A",
      },
      {
        label: "Seating Capacity",
        value: car.seats || "N/A",
      },
      {
        label: "Auction Grade",
        value:
          car.grade_overall !== undefined && car.grade_overall !== null
            ? car.grade_overall
            : "N/A",
      },
      {
        label: "Engine No.",
        value: car.engine_number || "N/A",
      },
      {
        label: "Chassis No.",
        value: car.chassis_no_full || car.chassis_no_masked || "N/A",
      },
      {
        label: "No. of Keys",
        value:
          car.number_of_keys !== undefined && car.number_of_keys !== null
            ? car.number_of_keys
            : "N/A",
      },
      {
        label: "Status",
        value: (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              car.status
            )}`}
          >
            {car.status
              ? car.status.charAt(0).toUpperCase() + car.status.slice(1)
              : "N/A"}
          </span>
        ),
      },
    ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Specifications Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <SlidersHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
            Specifications
          </h3>
        </div>
        <div className="space-y-4 sm:space-y-5">
          {/* Refined Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            {specificationItems.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {label}
                </span>
                <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Stock Section */}
          {stockData && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Boxes className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                  Stock
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Availability
                  </span>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {stockData.quantity}
                  </div>
                </div>
                {stockData.price && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Stock Price
                    </span>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {typeof stockData.price === "string"
                        ? parseFloat(stockData.price).toLocaleString()
                        : stockData.price.toLocaleString()}
                    </div>
                  </div>
                )}
                {stockData.notes && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Notes
                    </span>
                    <div className="mt-2 text-sm text-gray-700 italic">
                      {stockData.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Section */}
          {(car.location || car.country_origin || carExtras.port) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                  Location
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                {carExtras.port && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Port
                    </span>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {carExtras.port}
                    </div>
                  </div>
                )}
                {car.location && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Location
                    </span>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {car.location}
                    </div>
                  </div>
                )}
                {car.country_origin && (
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Country
                    </span>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {car.country_origin}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chassis Number with View Button */}
          {carExtras.chassis_no && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Chassis No.:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {carExtras.chassis_no}
                </span>
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-blue-300 text-xs font-medium">
                  View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Details */}
      {car.detail && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
            Additional Details
          </h3>
          {car.detail.short_title && (
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {car.detail.short_title}
            </p>
          )}
          {car.detail.full_title && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {car.detail.full_title}
            </p>
          )}
          {car.detail.description && (
            <p className="text-gray-700 dark:text-gray-300">
              {car.detail.description}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {car.notes && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
            Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{car.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CarSpecifications;
