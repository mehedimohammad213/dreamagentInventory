import React from "react";

interface StockStatusBadgesProps {
  effectiveStatus: string;
  /** Stock row only: distinguishes Available vs Unavailable when status is effectively available */
  quantity?: number;
}

/** Status chips under Car Information — matches app inventory / workflow statuses */
export const StockStatusBadges: React.FC<StockStatusBadgesProps> = ({
  effectiveStatus,
  quantity,
}) => {
  const hasQty = quantity !== undefined;

  return (
    <>
      {effectiveStatus === "available" &&
        (hasQty ? (
          quantity > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              Unavailable
            </span>
          )
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            Available
          </span>
        ))}
      {effectiveStatus === "sold" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          Sold
        </span>
      )}
      {effectiveStatus === "reserved" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Reserved
        </span>
      )}
      {effectiveStatus === "pending" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
          Pending
        </span>
      )}
      {effectiveStatus === "in_transit" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          In Transit
        </span>
      )}
      {effectiveStatus === "preorder" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
          Preorder
        </span>
      )}
      {(effectiveStatus === "damaged" ||
        effectiveStatus === "lost" ||
        effectiveStatus === "stolen") && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 capitalize">
          {effectiveStatus}
        </span>
      )}
    </>
  );
};
