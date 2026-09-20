import type { PendingCarRecord } from "../hooks/usePendingCarsFilters";

/** Applies the same search/year/make/model/color/fuel rules as the stock table filters. */
export function filterPendingCarsLikeStockFilters(
  cars: PendingCarRecord[],
  opts: {
    searchTerm: string;
    yearFilter: string;
    makeFilter: string;
    modelFilter: string;
    colorFilter: string;
    fuelFilter: string;
    fromDateFilter?: string;
    toDateFilter?: string;
  }
): PendingCarRecord[] {
  let filtered = [...cars];

  if (opts.searchTerm) {
    const searchLower = opts.searchTerm.toLowerCase();
    filtered = filtered.filter((car) => {
      return (
        String(car.make ?? "")
          .toLowerCase()
          .includes(searchLower) ||
        String(car.model ?? "")
          .toLowerCase()
          .includes(searchLower) ||
        String(car.year ?? "").includes(searchLower) ||
        String(car.chassis_no_full ?? "")
          .toLowerCase()
          .includes(searchLower) ||
        String(car.chassis_no_masked ?? "")
          .toLowerCase()
          .includes(searchLower) ||
        String(car.ref_no ?? "")
          .toLowerCase()
          .includes(searchLower)
      );
    });
  }

  if (opts.yearFilter) {
    filtered = filtered.filter(
      (car) => car.year?.toString() === opts.yearFilter
    );
  }
  if (opts.makeFilter) {
    filtered = filtered.filter((car) => car.make === opts.makeFilter);
  }
  if (opts.modelFilter) {
    filtered = filtered.filter((car) => car.model === opts.modelFilter);
  }
  if (opts.colorFilter) {
    const cf = opts.colorFilter.toLowerCase();
    filtered = filtered.filter(
      (car) => String(car.color ?? "").toLowerCase() === cf
    );
  }
  if (opts.fuelFilter) {
    const ff = opts.fuelFilter.toLowerCase();
    filtered = filtered.filter(
      (car) => String(car.fuel ?? "").toLowerCase() === ff
    );
  }

  if (opts.fromDateFilter) {
    filtered = filtered.filter((car) => {
      const createdAt = car.created_at;
      if (!createdAt) return false;
      const dateStr = String(createdAt).substring(0, 10);
      return dateStr >= opts.fromDateFilter!;
    });
  }

  if (opts.toDateFilter) {
    filtered = filtered.filter((car) => {
      const createdAt = car.created_at;
      if (!createdAt) return false;
      const dateStr = String(createdAt).substring(0, 10);
      return dateStr <= opts.toDateFilter!;
    });
  }

  return filtered;
}
