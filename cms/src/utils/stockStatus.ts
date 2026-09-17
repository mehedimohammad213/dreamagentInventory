import type { Stock } from "../services/stockApi";
import { STOCK_STATUS_VALUES } from "../services/stockApi";

const STOCK_STATUSES = new Set<string>(STOCK_STATUS_VALUES);

/**
 * Merges car.status and stock.status when they drift (e.g. car marked sold via car edit
 * but stocks row still "available").
 */
export function getEffectiveStockStatus(stock: Stock): string {
  const stockSt = String(stock.status || "available").toLowerCase();
  const carSt = stock.car?.status
    ? String(stock.car.status).toLowerCase()
    : "";

  if (stockSt === "sold" || carSt === "sold") {
    return "sold";
  }

  /** Stock rows often stay default `available` while workflow lives on `car.status`. */
  if (
    stockSt === "available" &&
    carSt &&
    STOCK_STATUSES.has(carSt) &&
    carSt !== "available"
  ) {
    return carSt;
  }

  if (STOCK_STATUSES.has(stockSt)) {
    return stockSt;
  }
  if (carSt && STOCK_STATUSES.has(carSt)) {
    return carSt;
  }

  return "available";
}

export function isStockRowSold(stock: Stock): boolean {
  return getEffectiveStockStatus(stock) === "sold";
}

/**
 * Unified "All Stock" list: rows are either stock records or pending cars (no stock row yet).
 */
export function getEffectiveStatusForUnifiedRow(
  row:
    | { kind: "stock"; stock: Stock }
    | { kind: "pending"; car: { status?: string } }
): string {
  if (row.kind === "stock") {
    return getEffectiveStockStatus(row.stock);
  }
  const carSt = String(row.car?.status ?? "").toLowerCase().trim();
  if (carSt === "sold") return "sold";
  if (STOCK_STATUSES.has(carSt)) return carSt;
  return "pending";
}

/** Cars in the “no stock row yet” pool still carry `car.status` (e.g. sold after stock was removed). */
export function isCarStatusSold(car: { status?: string } | null | undefined): boolean {
  return String(car?.status ?? "").toLowerCase() === "sold";
}

/**
 * Stock “Pending” tab + unified All Stock pending block: cars with no stock row yet.
 * Includes `sold` so a previously sold vehicle can be restocked (new stock uses `available`
 * and syncs car status from the API).
 */
export function isCarEligibleForPendingStockTab(
  car: { status?: string } | null | undefined
): boolean {
  const s = String(car?.status ?? "").toLowerCase().trim();
  return (
    s === "pending" ||
    s === "preorder" ||
    s === "in_transit" ||
    s === "available" ||
    s === "sold" ||
    s === ""
  );
}

/** Order for “status-wise” lists: workflow first, then issues, sold last */
export const STATUS_LIST_ORDER = [
  "pending",
  "preorder",
  "in_transit",
  "available",
  "reserved",
  "damaged",
  "lost",
  "stolen",
  "sold",
] as const;

export function getStatusSortRank(status: string): number {
  const idx = STATUS_LIST_ORDER.indexOf(
    status as (typeof STATUS_LIST_ORDER)[number]
  );
  return idx === -1 ? STATUS_LIST_ORDER.length : idx;
}

export const STATUS_SECTION_LABELS: Record<string, string> = {
  pending: "Pending",
  available: "Available",
  reserved: "Reserved",
  in_transit: "In Transit",
  preorder: "Preorder",
  damaged: "Damaged",
  lost: "Lost",
  stolen: "Stolen",
  sold: "Sold",
};

/** Options for inventory status dropdowns (order matches STATUS_LIST_ORDER). */
export const STOCK_STATUS_DROPDOWN_OPTIONS: {
  value: string;
  label: string;
}[] = STATUS_LIST_ORDER.map((value) => ({
  value,
  label: STATUS_SECTION_LABELS[value] ?? value,
}));
