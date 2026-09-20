"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  carApi,
  Car as CarType,
  CarFilterOptions,
} from "../../services/carApi";
import { categoryApi } from "../../services/categoryApi";
import { stockApi, Stock } from "../../services/stockApi";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCarFilters } from "../../hooks/useCarFilters";
import { usePdfGenerator } from "../../hooks/usePdfGenerator";
import SearchFilters from "../../components/car/SearchFilters";
import CarTable from "../../components/car/CarTable";
import Pagination from "../../components/car/Pagination";
import CarCatalogLoading from "../../components/car/CarCatalogLoading";
import CarCatalogEmpty from "../../components/car/CarCatalogEmpty";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import {
  formatPrice,
  getStatusColor,
  getGradeColor,
  getStockStatusColor,
} from "../../utils/carUtils";

const Car: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
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
    clearFilters,
    searchParams,
  } = useCarFilters();

  const [cars, setCars] = useState<CarType[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [filterOptions, setFilterOptions] = useState<CarFilterOptions | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stockData, setStockData] = useState<Map<number, Stock>>(new Map());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState<CarType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToCart, isCarLoading } = useCart();
  const { generatePDF, isGeneratingPDF } = usePdfGenerator();

  useEffect(() => {
    console.log("Car page: Component mounted, fetching data...");
    fetchCars();
    fetchCategories();
    fetchFilterOptions();
    fetchStockData();
  }, [
    currentPage,
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
  ]);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching cars with params:", {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        make: makeFilter || undefined,
        model: modelFilter || undefined,
        year: yearFilter || undefined,
        transmission: transmissionFilter || undefined,
        fuel: fuelFilter || undefined,
        color: colorFilter || undefined,
        price_from: priceRange.min || undefined,
        price_to: priceRange.max || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
        per_page: perPage,
        page: currentPage,
      });

      const response = await carApi.getCars({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        make: makeFilter || undefined,
        model: modelFilter || undefined,
        year: yearFilter || undefined,
        transmission: transmissionFilter || undefined,
        fuel: fuelFilter || undefined,
        color: colorFilter || undefined,
        price_from: priceRange.min || undefined,
        price_to: priceRange.max || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
        per_page: perPage,
        page: currentPage,
      });

      console.log("Cars API response:", response);

      if (response.success && response.data.data) {
        console.log("Setting cars:", response.data.data);
        const processedCars = [...response.data.data];

        // Manual sorting as fallback or secondary sort
        if (sortBy === "price_amount") {
          processedCars.sort((a, b) => {
            const priceA = Number((a as any).price_amount) || 0;
            const priceB = Number((b as any).price_amount) || 0;
            return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
          });
        } else if (sortBy === "created_at") {
          processedCars.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          });
        } else if (sortBy === "id") {
          processedCars.sort((a, b) => {
            const valA = a.id;
            const valB = b.id;
            return sortDirection === "asc" ? valA - valB : valB - valA;
          });
        } else if (sortBy === "model") {
          processedCars.sort((a, b) => {
            const modelA = (a.model || "").toLowerCase();
            const modelB = (b.model || "").toLowerCase();
            const cmp = modelA.localeCompare(modelB);
            return sortDirection === "asc" ? cmp : -cmp;
          });
        }

        setCars(processedCars);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
      } else {
        console.log("No cars found or invalid response structure");
        setCars([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
      setTotalPages(1);
      setTotalItems(0);

      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          console.error("Authentication failed - redirecting to login");
          // The API service should handle this automatically
        } else if (
          error.message.includes("Network Error") ||
          error.message.includes("fetch")
        ) {
          console.error("Network error - backend might be down");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await carApi.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const response = await stockApi.getStocks({ per_page: 1000 });
      if (response.success && response.data) {
        const stockMap = new Map<number, Stock>();
        response.data.forEach((stock: Stock) => {
          // Convert car_id to number since it comes as string from API
          const carId =
            typeof stock.car_id === "string"
              ? parseInt(stock.car_id)
              : stock.car_id;
          stockMap.set(carId, stock);
        });
        setStockData(stockMap);
        console.log("Stock data loaded:", stockMap.size, "items");
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const handleViewCar = (car: CarType) => {
    // Preserve current URL params when navigating
    navigate(`/car-view/${car.id}?${searchParams.toString()}`);
  };

  const handleAddToCart = (car: CarType) => {
    addToCart(car);
  };

  // Admin button handlers
  const handleAddCar = () => {
    navigate("/create-car");
  };

  const handleEditCar = (car: CarType) => {
    // Preserve current URL params when navigating
    navigate(`/update-car/${car.id}?${searchParams.toString()}`);
  };

  const handleDeleteCar = (car: CarType) => {
    setCarToDelete(car);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;

    setIsDeleting(true);
    try {
      await carApi.deleteCar(carToDelete.id);
      setCars(cars.filter((car) => car.id !== carToDelete.id));
      setShowDeleteModal(false);
      setCarToDelete(null);
      // You could add a success message here if needed
    } catch (error) {
      console.error("Error deleting car:", error);
      // You could add an error message here if needed
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGeneratePDF = () => {
    generatePDF({
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
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        {/* Search Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          makeFilter={makeFilter}
          setMakeFilter={setMakeFilter}
          modelFilter={modelFilter}
          setModelFilter={setModelFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          transmissionFilter={transmissionFilter}
          setTransmissionFilter={setTransmissionFilter}
          colorFilter={colorFilter}
          setColorFilter={setColorFilter}
          fuelFilter={fuelFilter}
          setFuelFilter={setFuelFilter}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          isGeneratingPDF={isGeneratingPDF}
          onGeneratePDF={handleGeneratePDF}
          onClearFilters={clearFilters}
          {...(user?.role === "admin" && {
            onAddCar: handleAddCar,
            isAdmin: true,
          })}
          filterOptions={filterOptions}
          categories={categories}
        />

        {/* Cars Table Display */}
        {isLoading ? (
          <CarCatalogLoading />
        ) : cars.length === 0 ? (
          <CarCatalogEmpty onClearFilters={clearFilters} />
        ) : (
          <CarTable
            cars={cars}
            stockData={stockData}
            onViewCar={handleViewCar}
            onAddToCart={handleAddToCart}
            {...(user?.role === "admin" && {
              onEditCar: handleEditCar,
              onDeleteCar: handleDeleteCar,
            })}
            isCarLoading={isCarLoading}
            getStatusColor={getStatusColor}
            getGradeColor={getGradeColor}
            getStockStatusColor={getStockStatusColor}
            formatPrice={formatPrice}
            isAdmin={user?.role === "admin"}
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Car"
        message={`Are you sure you want to delete "${carToDelete?.make} ${carToDelete?.model}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Car;
