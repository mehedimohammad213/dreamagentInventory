export type PurchasePageTab = "lc_wise" | "history";

const ALLOWED: PurchasePageTab[] = ["lc_wise", "history"];

/** Path back to purchase admin with optional tab (`/admin/purchase-history?tab=…`). */
export function purchaseHistoryPath(tab?: PurchasePageTab | null): string {
  if (tab && ALLOWED.includes(tab)) {
    return `/admin/purchase-history?tab=${tab}`;
  }
  return "/admin/purchase-history";
}
