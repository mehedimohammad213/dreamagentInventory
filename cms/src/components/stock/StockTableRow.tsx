import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Stock } from "../../services/stockApi";
import {
  getGradeColor,
  formatPrice as formatPriceUtil,
  getCssColor,
} from "../../utils/carUtils";
import { getEffectiveStockStatus } from "../../utils/stockStatus";
import StockActionsDropdown from "./StockActionsDropdown";
import { StockStatusBadges } from "./StockStatusBadges";

interface StockTableRowProps {
  stock: Stock;
  currentStockCount: number;
  showCount: boolean;
  onEdit: (stock: Stock) => void;
  onDelete: (stock: Stock) => void;
  onView?: (stock: Stock) => void;
  /** When false, hide delete (e.g. sold-out tab). */
  showDelete?: boolean;
  /** User role: view-only (no edit/delete). */
  readOnly?: boolean;
  /** Fallback when price is missing/invalid. */
  emptyPriceLabel?: string;
}

const StockTableRow: React.FC<StockTableRowProps> = ({
  stock,
  currentStockCount,
  showCount,
  onEdit,
  onDelete,
  onView,
  showDelete = true,
  readOnly = false,
  emptyPriceLabel = "N/A",
}) => {
  const car = stock.car;
  const effectiveStatus = getEffectiveStockStatus(stock);
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

  const formatPrice = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null) return emptyPriceLabel;
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return emptyPriceLabel;
    const formatted = formatPriceUtil(numAmount, currency);
    // Extract just the number part to match CarTable display
    return formatted.replace(/^[A-Z]+\s/, "");
  };

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
      onClick={() => onView?.(stock)}
    >
      {/* Left accent bar on hover - same as CarTable */}
      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />
      {/* Car Information - Enhanced */}
      <div className="col-span-2 flex items-center gap-3">
        {/*
          Car image (hidden). Uncomment to show vehicle thumbnail again.
          Keeping it commented for reuse in future UI tweaks.
        */}
        {/*
          <div className="relative w-28 h-24 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 group-hover:border-blue-300">
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
            {stock.quantity > 0 && (
              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md">
                {stock.quantity}
              </div>
            )}
          </div>
        */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
            {car?.year} {car?.make} {car?.model}
            {car?.variant && (
              <span className="text-sm font-normal text-gray-600">
                {" "}- {car.variant}
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            <span className="text-gray-500">Ref:</span>{" "}
            <span className="text-primary-600 font-mono break-all" title={refNo}>
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
            <StockStatusBadges
              effectiveStatus={effectiveStatus}
              quantity={stock.quantity}
            />
            {car?.package && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                {car.package}
              </span>
            )}
            {/* Stock quantity badge (previously overlayed on the thumbnail) */}
            {stock.quantity > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white shadow-sm">
                {stock.quantity}
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
      <div className="col-span-3 flex items-center">
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
              : emptyPriceLabel}
          </span>
        </div>
      </div>

      {/* Current Stock Count */}
      <div className="col-span-1 flex items-center justify-center">
        {showCount ? (
          <span className="inline-flex items-center justify-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold min-w-[60px]">
            {currentStockCount}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">-</span>
        )}
      </div>

      {/* Actions — ⋮ menu */}
      <div
        className="col-span-1 flex items-center justify-center"
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
                    onClick: () => onView(stock),
                    variant: "primary" as const,
                  },
                ]
              : []),
            ...(!readOnly
              ? [
                  {
                    id: "edit",
                    label: "Edit",
                    icon: Edit,
                    onClick: () => onEdit(stock),
                    variant: "amber" as const,
                  },
                  ...(showDelete
                    ? [
                        {
                          id: "delete",
                          label: "Delete stock",
                          icon: Trash2,
                          onClick: () => onDelete(stock),
                          variant: "danger" as const,
                        },
                      ]
                    : []),
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
};

export default StockTableRow;
