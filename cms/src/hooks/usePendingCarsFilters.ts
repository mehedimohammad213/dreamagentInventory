import { useState, useMemo, useEffect, useCallback } from "react";
import { isCarEligibleForPendingStockTab } from "../utils/stockStatus";

const PER_PAGE = 19;

export type PendingCarRecord = Record<string, unknown> & {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  fuel?: string;
  color?: string;
  ref_no?: string;
  chassis_no_full?: string;
  chassis_no_masked?: string;
  status?: string;
  created_at?: string;
};

export function usePendingCarsFilters(availableCars: PendingCarRecord[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter, makeFilter, modelFilter, colorFilter, fuelFilter, fromDateFilter, toDateFilter]);

  const derived = useMemo(() => {
    /** No stock row yet; includes sold cars so they can be restocked. */
    const base = availableCars.filter(isCarEligibleForPendingStockTab);

    let filtered = [...base];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((car) => {
        const make = String(car.make ?? "").toLowerCase();
        const model = String(car.model ?? "").toLowerCase();
        const ref = String(car.ref_no ?? "").toLowerCase();
        const chFull = String(car.chassis_no_full ?? "").toLowerCase();
        const chMask = String(car.chassis_no_masked ?? "").toLowerCase();
        const yr = String(car.year ?? "");
        return (
          make.includes(q) ||
          model.includes(q) ||
          yr.includes(q) ||
          ref.includes(q) ||
          chFull.includes(q) ||
          chMask.includes(q)
        );
      });
    }

    if (yearFilter) {
      filtered = filtered.filter(
        (car) => car.year?.toString() === yearFilter
      );
    }
    if (makeFilter) {
      filtered = filtered.filter((car) => car.make === makeFilter);
    }
    if (modelFilter) {
      filtered = filtered.filter((car) => car.model === modelFilter);
    }
    if (colorFilter) {
      const cf = colorFilter.toLowerCase();
      filtered = filtered.filter(
        (car) => String(car.color ?? "").toLowerCase() === cf
      );
    }
    if (fuelFilter) {
      const ff = fuelFilter.toLowerCase();
      filtered = filtered.filter(
        (car) => String(car.fuel ?? "").toLowerCase() === ff
      );
    }

    if (fromDateFilter) {
      filtered = filtered.filter((car) => {
        const createdAt = car.created_at || (car as any).created_at;
        if (!createdAt) return false;
        const dateStr = String(createdAt).substring(0, 10);
        return dateStr >= fromDateFilter;
      });
    }

    if (toDateFilter) {
      filtered = filtered.filter((car) => {
        const createdAt = car.created_at || (car as any).created_at;
        if (!createdAt) return false;
        const dateStr = String(createdAt).substring(0, 10);
        return dateStr <= toDateFilter;
      });
    }

    const years = new Set<number>();
    const colors = new Set<string>();
    const fuels = new Set<string>();
    base.forEach((car) => {
      if (car.year != null) years.add(car.year);
      if (car.color) colors.add(car.color);
      if (car.fuel) fuels.add(car.fuel);
    });

    // Sort by descending id
    filtered.sort((a, b) => b.id - a.id);

    const totalPages = Math.max(
      Math.ceil(filtered.length / PER_PAGE),
      1
    );
    const start = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(start, start + PER_PAGE);

    return {
      sourceList: base,
      filteredAll: filtered,
      paginated,
      totalPages,
      totalItems: filtered.length,
      filterOptions: {
        years: Array.from(years).sort((a, b) => b - a),
        colors: Array.from(colors).sort(),
        fuels: Array.from(fuels).sort(),
      },
    };
  }, [
    availableCars,
    searchTerm,
    yearFilter,
    makeFilter,
    modelFilter,
    colorFilter,
    fuelFilter,
    fromDateFilter,
    toDateFilter,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage((p) =>
      p > derived.totalPages ? derived.totalPages : p
    );
  }, [derived.totalPages]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setYearFilter("");
    setMakeFilter("");
    setModelFilter("");
    setColorFilter("");
    setFuelFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setCurrentPage(1);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    yearFilter,
    setYearFilter,
    makeFilter,
    setMakeFilter,
    modelFilter,
    setModelFilter,
    colorFilter,
    setColorFilter,
    fuelFilter,
    setFuelFilter,
    fromDateFilter,
    setFromDateFilter,
    toDateFilter,
    setToDateFilter,
    currentPage,
    setCurrentPage,
    totalPages: derived.totalPages,
    totalItems: derived.totalItems,
    perPage: PER_PAGE,
    paginatedCars: derived.paginated,
    filteredAllCars: derived.filteredAll,
    sourceCount: derived.sourceList.length,
    filterOptions: derived.filterOptions,
    handleClearFilters,
  };
}
