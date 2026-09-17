import React from "react";
import { Package } from "lucide-react";
import { Stock } from "../../services/stockApi";
import StockTableRow from "./StockTableRow";
import PendingCarUnifiedRow from "./PendingCarUnifiedRow";
import type { PendingCarRecord } from "../../hooks/usePendingCarsFilters";
export type UnifiedStockRow =
  | { kind: "pending"; car: PendingCarRecord }
  | { kind: "stock"; stock: Stock };

interface StockTableProps {
  stocks: Stock[];
  allStocks: Stock[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
  onEdit: (stock: Stock) => void;
  onDelete: (stock: Stock) => void;
  onView?: (stock: Stock) => void;
  onRefresh: () => void;
  emptyStateVariant?: "default" | "soldout";
  showDelete?: boolean;
  /** When set, renders one combined list (pending cars + stock rows) instead of `stocks` only. */
  unifiedRows?: UnifiedStockRow[];
  unifiedPendingCallbacks?: {
    onView: (car: PendingCarRecord) => void;
    onEdit: (car: PendingCarRecord) => void;
    onDelete: (car: PendingCarRecord) => void;
    onCreateStock: (car: PendingCarRecord) => void;
  };
  /** Hide edit/delete for limited roles. */
  readOnly?: boolean;
}

const StockTable: React.FC<StockTableProps> = ({
  stocks,
  allStocks,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  emptyStateVariant = "default",
  showDelete = true,
  unifiedRows,
  unifiedPendingCallbacks,
  readOnly = false,
}) => {
  const useUnifiedList = unifiedRows != null;

  // Calculate current stock count for each make/model
  const stockCountsMap = React.useMemo(() => {
    const counts = new Map<string, number>();
    allStocks.forEach((stock) => {
      if (stock.car) {
        const key = `${stock.car.make}_${stock.car.model}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [allStocks]);

  const pendingMakeModelCountsOnPage = React.useMemo(() => {
    if (!unifiedRows?.length) return new Map<string, number>();
    const counts = new Map<string, number>();
    unifiedRows.forEach((row) => {
      if (row.kind !== "pending") return;
      const car = row.car;
      const key = `${car.make ?? ""}_${car.model ?? ""}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [unifiedRows]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-100 border-t-primary-600 mx-auto"></div>
        </div>
        <p className="text-gray-900 mt-4 font-medium">
          Loading stocks...
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching the latest inventory details
        </p>
      </div>
    );
  }

  if (useUnifiedList && unifiedRows!.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Package className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          No vehicles match
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          Nothing in this combined list matches your filters. Try clearing filters or search.
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

  if (!useUnifiedList && stocks.length === 0) {
    const isSoldoutTab = emptyStateVariant === "soldout";
    return (
      <div className="text-center py-20">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Package className="w-20 h-20 text-primary-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          {isSoldoutTab ? "No sold vehicles" : "No stocks found"}
        </h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          {isSoldoutTab
            ? "There are no sold stock records yet, or none match your filters. Sold items appear here when stock status is set to sold."
            : "We couldn&apos;t find any stocks matching your criteria. Try adjusting your filters or search terms to discover more options."}
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
        <div className="min-w-[1200px]">
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
              <div className="col-span-3">
                <span>Key Features</span>
              </div>
              <div className="col-span-1">
                <span>Price</span>
              </div>
              <div className="col-span-1 text-center">
                <span>Stock</span>
              </div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body — unified All Stock: pending block then stock rows (same order as combined list) */}
          <div className="divide-y divide-gray-100">
            {useUnifiedList && unifiedRows && unifiedPendingCallbacks
              ? (() => {
                  const pendingSlice = unifiedRows.filter(
                    (r): r is { kind: "pending"; car: PendingCarRecord } =>
                      r.kind === "pending"
                  );
                  const stockSlice = unifiedRows
                    .filter((r): r is { kind: "stock"; stock: Stock } => r.kind === "stock")
                    .map((r) => r.stock);

                  const pendingNodes: React.ReactNode[] = [];
                  pendingSlice.forEach((row, i) => {
                    const car = row.car;
                    const makeModelKey = `${car.make ?? ""}_${car.model ?? ""}`;
                    const totalForKey =
                      pendingMakeModelCountsOnPage.get(makeModelKey) || 0;
                    const firstIdx = pendingSlice.findIndex(
                      (r) =>
                        `${r.car.make ?? ""}_${r.car.model ?? ""}` ===
                        makeModelKey
                    );
                    pendingNodes.push(
                      <PendingCarUnifiedRow
                        key={`pending-${car.id}`}
                        car={car}
                        showMakeModelCount={firstIdx === i}
                        makeModelCount={totalForKey}
                        emptyPriceLabel="N/A"
                        onView={unifiedPendingCallbacks.onView}
                        onEdit={unifiedPendingCallbacks.onEdit}
                        onDelete={unifiedPendingCallbacks.onDelete}
                        onCreateStock={unifiedPendingCallbacks.onCreateStock}
                      />
                    );
                  });

                  const stockNodes = stockSlice.map((stock, index) => {
                    const makeModelKey = stock.car
                      ? `${stock.car.make}_${stock.car.model}`
                      : "";
                    const currentStockCount = stock.car
                      ? stockCountsMap.get(makeModelKey) || 0
                      : 0;

                    const isFirstOfMakeModel =
                      stock.car &&
                      stockSlice.findIndex(
                        (s) =>
                          s.car &&
                          `${s.car.make}_${s.car.model}` === makeModelKey
                      ) === index;

                    return (
                      <StockTableRow
                        key={stock.id}
                        stock={stock}
                        currentStockCount={currentStockCount}
                        showCount={!!isFirstOfMakeModel}
                        emptyPriceLabel="N/A"
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onView={onView}
                        showDelete={showDelete}
                        readOnly={readOnly}
                      />
                    );
                  });

                  return [...pendingNodes, ...stockNodes];
                })()
              : stocks.map((stock, index) => {
                  const makeModelKey = stock.car
                    ? `${stock.car.make}_${stock.car.model}`
                    : "";
                  const currentStockCount = stock.car
                    ? stockCountsMap.get(makeModelKey) || 0
                    : 0;

                  const isFirstOfMakeModel =
                    stock.car &&
                    stocks.findIndex(
                      (s) =>
                        s.car && `${s.car.make}_${s.car.model}` === makeModelKey
                    ) === index;

                  return (
                    <StockTableRow
                      key={stock.id}
                      stock={stock}
                      currentStockCount={currentStockCount}
                      showCount={!!isFirstOfMakeModel}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onView={onView}
                      showDelete={showDelete}
                      readOnly={readOnly}
                    />
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTable;
