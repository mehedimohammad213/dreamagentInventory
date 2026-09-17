import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useCarFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [makeFilter, setMakeFilter] = useState(searchParams.get("make") || "");
  const [modelFilter, setModelFilter] = useState(searchParams.get("model") || "");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") || "");
  const [transmissionFilter, setTransmissionFilter] = useState(searchParams.get("transmission") || "");
  const [fuelFilter, setFuelFilter] = useState(searchParams.get("fuel") || "");
  const [colorFilter, setColorFilter] = useState(searchParams.get("color") || "");
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("priceMin") || "",
    max: searchParams.get("priceMax") || ""
  });
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at");
  const [sortDirection, setSortDirection] = useState(searchParams.get("sortDirection") || "desc");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Update URL parameters when state changes
  useEffect(() => {
    const params: any = {};

    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (makeFilter) params.make = makeFilter;
    if (modelFilter) params.model = modelFilter;
    if (yearFilter) params.year = yearFilter;
    if (transmissionFilter) params.transmission = transmissionFilter;
    if (fuelFilter) params.fuel = fuelFilter;
    if (colorFilter) params.color = colorFilter;
    if (priceRange.min) params.priceMin = priceRange.min;
    if (priceRange.max) params.priceMax = priceRange.max;
    if (sortBy !== "created_at") params.sortBy = sortBy;
    if (sortDirection !== "desc") params.sortDirection = sortDirection;
    if (currentPage !== 1) params.page = currentPage.toString();

    setSearchParams(params, { replace: true });
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    makeFilter,
    modelFilter,
    yearFilter,
    transmissionFilter,
    fuelFilter,
    colorFilter,
    priceRange,
    sortBy,
    sortDirection,
    currentPage,
    setSearchParams,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCategoryFilter("");
    setMakeFilter("");
    setModelFilter("");
    setYearFilter("");
    setTransmissionFilter("");
    setFuelFilter("");
    setColorFilter("");
    setPriceRange({ min: "", max: "" });
    setSortBy("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    makeFilter,
    setMakeFilter,
    modelFilter,
    setModelFilter,
    yearFilter,
    setYearFilter,
    transmissionFilter,
    setTransmissionFilter,
    fuelFilter,
    setFuelFilter,
    colorFilter,
    setColorFilter,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    showAdvancedFilters,
    setShowAdvancedFilters,
    // Actions
    clearFilters,
    // URL params
    searchParams,
  };
};
