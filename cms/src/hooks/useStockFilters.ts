import { useState, useMemo, useEffect, useCallback } from "react";
import { Stock } from "../services/stockApi";
import {
    getEffectiveStockStatus,
    getStatusSortRank,
    isStockRowSold,
} from "../utils/stockStatus";

export type FilterOptions = {
    years?: number[];
    colors?: string[];
    fuels?: string[];
};

const PER_PAGE = 10;

export type StockListScope = "all" | "available" | "sold";

export const useStockFilters = (
    allStocks: Stock[],
    stockScope: StockListScope = "all"
) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [makeFilter, setMakeFilter] = useState("");
    const [modelFilter, setModelFilter] = useState("");
    const [colorFilter, setColorFilter] = useState("");
    const [fuelFilter, setFuelFilter] = useState("");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, yearFilter, makeFilter, modelFilter, colorFilter, fuelFilter, fromDateFilter, toDateFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [stockScope]);

    const scopedStocks = useMemo(() => {
        if (stockScope === "sold") {
            return allStocks.filter((s) => isStockRowSold(s));
        }
        if (stockScope === "available") {
            return allStocks.filter((s) => getEffectiveStockStatus(s) === "available");
        }
        return allStocks;
    }, [allStocks, stockScope]);

    const derivedData = useMemo(() => {
        if (scopedStocks.length === 0) {
            return {
                stocks: [] as Stock[],
                filteredStocksFull: [] as Stock[],
                totalPages: 1,
                totalItems: 0,
                filterOptions: {} as FilterOptions,
            };
        }

        let filtered = [...scopedStocks];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter((stock) => {
                const car = stock.car;
                if (!car) return false;
                return (
                    car.make?.toLowerCase().includes(searchLower) ||
                    car.model?.toLowerCase().includes(searchLower) ||
                    car.year?.toString().includes(searchLower) ||
                    car.chassis_no_full?.toLowerCase().includes(searchLower) ||
                    car.chassis_no_masked?.toLowerCase().includes(searchLower) ||
                    car.ref_no?.toLowerCase().includes(searchLower) ||
                    car.variant?.toLowerCase().includes(searchLower)
                );
            });
        }

        if (yearFilter) {
            filtered = filtered.filter(
                (stock) => stock.car?.year?.toString() === yearFilter
            );
        }

        if (makeFilter) {
            filtered = filtered.filter(
                (stock) => stock.car?.make === makeFilter
            );
        }

        if (modelFilter) {
            filtered = filtered.filter(
                (stock) => stock.car?.model === modelFilter
            );
        }

        if (colorFilter) {
            filtered = filtered.filter(
                (stock) =>
                    stock.car?.color?.toLowerCase() === colorFilter.toLowerCase()
            );
        }

        if (fuelFilter) {
            filtered = filtered.filter(
                (stock) => stock.car?.fuel?.toLowerCase() === fuelFilter.toLowerCase()
            );
        }

        if (fromDateFilter) {
            filtered = filtered.filter((stock) => {
                if (!stock.created_at) return false;
                const dateStr = stock.created_at.substring(0, 10); // "YYYY-MM-DD"
                return dateStr >= fromDateFilter;
            });
        }

        if (toDateFilter) {
            filtered = filtered.filter((stock) => {
                if (!stock.created_at) return false;
                const dateStr = stock.created_at.substring(0, 10); // "YYYY-MM-DD"
                return dateStr <= toDateFilter;
            });
        }

        if (sortBy) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortBy === "created_at") {
                    aValue = new Date(a.created_at || 0).getTime();
                    bValue = new Date(b.created_at || 0).getTime();
                } else if (sortBy.startsWith("car.")) {
                    const field = sortBy.replace("car.", "");
                    aValue = (a.car as any)?.[field];
                    bValue = (b.car as any)?.[field];
                } else {
                    aValue = (a as any)[sortBy];
                    bValue = (b as any)[sortBy];
                }

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortOrder === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            });
        }

        const startIndex = (currentPage - 1) * PER_PAGE;
        const endIndex = startIndex + PER_PAGE;
        const paginatedStocks = filtered.slice(startIndex, endIndex);

        const years = new Set<number>();
        const colors = new Set<string>();
        const fuels = new Set<string>();

        scopedStocks.forEach((stock) => {
            if (stock.car?.year) years.add(stock.car.year);
            if (stock.car?.color) colors.add(stock.car.color);
            if (stock.car?.fuel) fuels.add(stock.car.fuel);
        });

        return {
            stocks: paginatedStocks,
            /** Full filtered stock list before pagination (for unified All Stock view). */
            filteredStocksFull: filtered,
            totalPages: Math.max(Math.ceil(filtered.length / PER_PAGE), 1),
            totalItems: filtered.length,
            filterOptions: {
                years: Array.from(years).sort((a, b) => b - a),
                colors: Array.from(colors).sort(),
                fuels: Array.from(fuels).sort(),
            },
        };
    }, [
        scopedStocks,
        stockScope,
        colorFilter,
        currentPage,
        fuelFilter,
        makeFilter,
        modelFilter,
        searchTerm,
        sortBy,
        sortOrder,
        yearFilter,
        fromDateFilter,
        toDateFilter,
    ]);

    const handleSort = useCallback(
        (field: string) => {
            if (sortBy === field) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
                setSortBy(field);
                setSortOrder("asc");
            }
            setCurrentPage(1);
        },
        [sortBy, sortOrder]
    );

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
        setSortBy("created_at");
        setSortOrder("desc");
    }, []);

    return {
        ...derivedData,
        scopedStocks,
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
        sortBy,
        sortOrder,
        currentPage,
        setCurrentPage,
        handleSort,
        handleClearFilters,
        perPage: PER_PAGE,
    };
};
