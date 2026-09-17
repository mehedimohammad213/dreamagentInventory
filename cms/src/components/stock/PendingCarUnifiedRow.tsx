import React from "react";
import { Eye, Edit, Trash2, PackagePlus } from "lucide-react";
import {
  getGradeColor,
  formatPrice as formatPriceUtil,
  getCssColor,
} from "../../utils/carUtils";
import type { PendingCarRecord } from "../../hooks/usePendingCarsFilters";
import {
  getEffectiveStatusForUnifiedRow,
  isCarStatusSold,
} from "../../utils/stockStatus";
import StockActionsDropdown from "./StockActionsDropdown";
import { StockStatusBadges } from "./StockStatusBadges";

interface PendingCarUnifiedRowProps {
  car: PendingCarRecord;
  showMakeModelCount: boolean;
  makeModelCount: number;
  onView?: (car: PendingCarRecord) => void;
  onEdit?: (car: PendingCarRecord) => void;
  onDelete?: (car: PendingCarRecord) => void;
  onCreateStock: (car: PendingCarRecord) => void;
  /** Fallback when price is missing/invalid. */
  emptyPriceLabel?: string;
}

const formatPrice = (
  amount?: number | string,
  currency?: string,
  emptyPriceLabel: string = "N/A"
) => {
  if (amount === undefined || amount === null) return emptyPriceLabel;
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return emptyPriceLabel;
  const formatted = formatPriceUtil(numAmount, currency);
  return formatted.replace(/^[A-Z]+\s/, "");
};

/**
 * One grid row aligned with {@link StockTableRow} for the unified All Stock table.
 */
const PendingCarUnifiedRow: React.FC<PendingCarUnifiedRowProps> = ({
  car,
  showMakeModelCount,
  makeModelCount,
  onView,
  onEdit,
  onDelete,
  onCreateStock,
  emptyPriceLabel = "N/A",
}) => {
  const carSold = isCarStatusSold(car);
  const effectiveStatus = getEffectiveStatusForUnifiedRow({
    kind: "pending",
    car,
  });
  const refNo =
    car.ref_no ||
    (car.id != null ? `AA${car.id.toString().padStart(6, "0")}` : "N/A");
  const chassisNo =
    car.chassis_no_full || car.chassis_no_masked || "N/A";

  const keysRaw = car.keys_feature ?? car["keys_feature"];
  const keyFeatures = keysRaw
    ? String(keysRaw)
        .split(",")
        .map((feature: string) => feature.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
      onClick={() => onView?.(car)}
    >
      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-amber-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />
      <div className="col-span-2 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
            {car.year} {car.make} {car.model}
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
            <span className="text-gray-400">Chassis:</span> {chassisNo}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StockStatusBadges effectiveStatus={effectiveStatus} />
            {car.category &&
            typeof car.category === "object" &&
            car.category !== null &&
            "name" in car.category ? (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                {String((car.category as { name: unknown }).name)}
              </span>
            ) : null}
            {car.package != null && car.package !== "" ? (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                {String(car.package)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="col-span-1 flex items-center">
        <span className="text-sm font-semibold text-gray-900">
          {car.mileage_km
            ? `${Number(car.mileage_km).toLocaleString()} km`
            : "N/A"}
        </span>
      </div>

      <div className="col-span-1 flex items-center">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {car.engine_cc
              ? `${Number(car.engine_cc).toLocaleString()} cc`
              : "N/A"}
          </span>
          {car.fuel && (
            <span className="text-xs text-gray-500 mt-0.5 capitalize">
              {String(car.fuel)}
            </span>
          )}
        </div>
      </div>

      <div className="col-span-1 flex items-center">
        <div className="flex items-center gap-2">
          {car.color && (
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm bg-gray-200"
              style={{ backgroundColor: getCssColor(String(car.color)) }}
              title={String(car.color)}
            />
          )}
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {car.color ? String(car.color) : "N/A"}
          </span>
        </div>
      </div>

      <div className="col-span-1 flex items-center">
        <div className="flex flex-col items-start gap-1">
          {car.grade_overall != null && car.grade_overall !== "" && (
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-md ${getGradeColor(
                String(car.grade_overall)
              )}`}
            >
              {String(car.grade_overall)}
            </span>
          )}
          {!car.grade_overall && (
            <span className="text-xs text-gray-400">N/A</span>
          )}
        </div>
      </div>

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

      <div className="col-span-1 flex items-center">
        <span className="text-sm font-semibold text-gray-900">
          {car.price_amount != null && car.price_amount !== ""
            ? formatPrice(
                car.price_amount as number | string,
                car.price_currency as string | undefined,
                emptyPriceLabel
              )
            : emptyPriceLabel}
        </span>
      </div>

      <div className="col-span-1 flex items-center justify-center">
        {showMakeModelCount ? (
          <span className="inline-flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-bold min-w-[60px] border border-amber-200">
            {makeModelCount}
          </span>
        ) : (
          <span className="text-sm text-amber-700 font-medium">—</span>
        )}
      </div>

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
            ...(onDelete
              ? [
                  {
                    id: "delete",
                    label: "Delete",
                    icon: Trash2,
                    onClick: () => onDelete(car),
                    variant: "danger" as const,
                  },
                ]
              : []),
            {
              id: "add-stock",
              label: carSold ? "Add stock (restock)" : "Add stock",
              icon: PackagePlus,
              onClick: () => onCreateStock(car),
              variant: "primary" as const,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default PendingCarUnifiedRow;
