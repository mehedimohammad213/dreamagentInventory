"use client";

import React, { useState, useEffect, useMemo } from "react";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import {
  StockHeader,
  StockFilters,
  StockTable,
  MessageDisplay,
  StockDrawer,
  StockDrawerForm,
} from "../../components/stock";
import Pagination from "../../components/car/Pagination";
import { InvoiceCreationModal } from "../../components/stock/InvoiceCreationModal";
import AvailableCarsTable from "../../components/stock/AvailableCarsTable";
import { useStockManagement } from "../../hooks/useStockManagement";
import { usePendingCarsFilters } from "../../hooks/usePendingCarsFilters";
import type { StockPageTab } from "../../components/stock/StockHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { stockApi, Stock } from "../../services/stockApi";
import { carApi } from "../../services/carApi";
import {
  getEffectiveStockStatus,
  getEffectiveStatusForUnifiedRow,
  isStockRowSold,
} from "../../utils/stockStatus";
import { filterPendingCarsLikeStockFilters } from "../../utils/filterPendingCarsLikeStockFilters";
import type { UnifiedStockRow } from "../../components/stock/StockTable";
import { useAuth } from "../../contexts/AuthContext";

const StockManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isStockUserView = user?.role === "user";
  const defaultTab: StockPageTab = isStockUserView ? "current" : "all";
  const allowedTabs: StockPageTab[] = isStockUserView
    ? ["current"]
    : ["all", "current"];
  const queryTab = searchParams.get("tab");
  const initialTab: StockPageTab =
    queryTab && allowedTabs.includes(queryTab as StockPageTab)
      ? (queryTab as StockPageTab)
      : defaultTab;

  const [activeTab, setActiveTab] = useState<StockPageTab>(initialTab);
  const [showPendingCarDeleteModal, setShowPendingCarDeleteModal] =
    useState(false);
  const [pendingCarToDelete, setPendingCarToDelete] = useState<{
    id: number;
    make?: string;
    model?: string;
  } | null>(null);
  const [isDeletingPendingCar, setIsDeletingPendingCar] = useState(false);
  const [allTabStatusFilter, setAllTabStatusFilter] = useState(searchParams.get("status") || "");

  const handleStatusFilterChange = (status: string) => {
    setAllTabStatusFilter(status);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (status) {
          next.set("status", status);
        } else {
          next.delete("status");
        }
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const s = searchParams.get("status") || "";
    setAllTabStatusFilter(s);
  }, [searchParams]);

  const [showChassisModal, setShowChassisModal] = useState(false);
  const [chassisInput, setChassisInput] = useState("");
  const [chassisError, setChassisError] = useState("");
  const [isCheckingChassis, setIsCheckingChassis] = useState(false);

  const handleAddStockClick = () => {
    setChassisInput("");
    setChassisError("");
    setShowChassisModal(false); // reset state safely
    setTimeout(() => {
      setShowChassisModal(true);
    }, 50);
  };

  const handleChassisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chassisInput.trim()) {
      setChassisError("Chassis number is required.");
      return;
    }

    const inputCleaned = chassisInput.trim();
    setIsCheckingChassis(true);
    setChassisError("");

    try {
      // Query database directly using the search API to fetch any cars matching this chassis number
      const response = await carApi.getCars({ search: inputCleaned });
      
      const cars = response.data?.data || response.data?.cars || [];
      const duplicateFoundInDb = cars.some(
        (c) => c.chassis_no_full?.trim().toLowerCase() === inputCleaned.toLowerCase() ||
               c.chassis_no_masked?.trim().toLowerCase() === inputCleaned.toLowerCase() ||
               c.ref_no?.trim().toLowerCase() === inputCleaned.toLowerCase()
      );

      if (duplicateFoundInDb) {
        setChassisError("This chassis number is already available in the car list.");
        return;
      }

      // Fallback: check in allStocks locally loaded in memory
      const existsInStocks = allStocks.some(
        (s) => s.car?.chassis_no_masked?.trim().toLowerCase() === inputCleaned.toLowerCase() ||
               s.car?.chassis_no_full?.trim().toLowerCase() === inputCleaned.toLowerCase()
      );

      // Fallback: check in availableCars locally loaded in memory
      const existsInAvailable = availableCars.some(
        (c: any) => c.chassis_no_masked?.trim().toLowerCase() === inputCleaned.toLowerCase() ||
                    c.chassis_no_full?.trim().toLowerCase() === inputCleaned.toLowerCase()
      );

      if (existsInStocks || existsInAvailable) {
        setChassisError("This chassis number is already available in the car list.");
        return;
      }

      setShowChassisModal(false);
      navigate("/create-car", {
        state: {
          returnStockTab: activeTab,
          prefilledChassisNo: inputCleaned,
        },
      });
    } catch (err) {
      console.error("Error checking duplicate chassis:", err);
      setChassisError("An error occurred while validating the chassis number. Please try again.");
    } finally {
      setIsCheckingChassis(false);
    }
  };

  const stockScope =
    activeTab === "soldout" ? "sold" : activeTab === "available" ? "available" : "all";

  const {
    stocks,
    allStocks,
    availableCars,
    isLoading,
    isLoadingAvailableCars,
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
    totalPages,
    totalItems,
    perPage,
    filterOptions,
    isGeneratingPDF,
    showDrawer,
    setShowDrawer,
    drawerMode,
    setDrawerMode,
    selectedStock,
    setSelectedStock,
    showDeleteModal,
    isDeleting,
    setShowDeleteModal,
    showInvoiceModal,
    message,
    handleCreateStock,
    handleEditStock,
    handleDeleteStock,
    confirmDelete,
    handleDrawerSubmit,
    handleDrawerClose,
    handleSort,
    handleClearFilters,
    generatePDF,
    handleCreateInvoice,
    setShowInvoiceModal,
    fetchStocks,
    fetchAvailableCars,
    showMessage,
    scopedStocks,
    filteredStocksFull,
  } = useStockManagement(stockScope);

  const pendingFilters = usePendingCarsFilters(availableCars);

  const stockTabCounts = useMemo(
    () => ({
      /** All Stock = every stock row + every car without a stock row (same total as unified list when unfiltered). */
      all: allStocks.length + availableCars.length,
      pending: pendingFilters.sourceCount,
      current: allStocks.length,
      available: allStocks.filter((s) => getEffectiveStockStatus(s) === "available").length,
      soldout: allStocks.filter((s) => isStockRowSold(s)).length,
    }),
    [pendingFilters.sourceCount, allStocks, availableCars.length]
  );

  const pendingFilteredForUnified = useMemo(
    () =>
      filterPendingCarsLikeStockFilters(availableCars, {
        searchTerm,
        yearFilter,
        makeFilter,
        modelFilter,
        colorFilter,
        fuelFilter,
        fromDateFilter,
        toDateFilter,
      }),
    [
      availableCars,
      searchTerm,
      yearFilter,
      makeFilter,
      modelFilter,
      colorFilter,
      fuelFilter,
      fromDateFilter,
      toDateFilter,
    ]
  );

  const unifiedCombined = useMemo((): UnifiedStockRow[] => {
    const pending = pendingFilteredForUnified.map((car) => ({
      kind: "pending" as const,
      car,
    }));
    const stocksPart = filteredStocksFull.map((stock) => ({
      kind: "stock" as const,
      stock,
    }));
    const combined = [...pending, ...stocksPart];
    combined.sort((a, b) => {
      const idA = a.kind === "pending" ? a.car.id : (a.stock.car?.id || a.stock.id);
      const idB = b.kind === "pending" ? b.car.id : (b.stock.car?.id || b.stock.id);
      return Number(idB) - Number(idA);
    });
    return combined;
  }, [pendingFilteredForUnified, filteredStocksFull]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    unifiedCombined.forEach((row) => {
      const status = getEffectiveStatusForUnifiedRow(row);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [unifiedCombined]);

  const unifiedFilteredByStatus = useMemo(() => {
    if (!allTabStatusFilter) return unifiedCombined;
    return unifiedCombined.filter(
      (row) => getEffectiveStatusForUnifiedRow(row) === allTabStatusFilter
    );
  }, [unifiedCombined, allTabStatusFilter]);

  const unifiedTotalItems = unifiedFilteredByStatus.length;
  const unifiedTotalPages = Math.max(
    Math.ceil(unifiedTotalItems / perPage),
    1
  );

  const unifiedPageRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return unifiedFilteredByStatus.slice(start, start + perPage);
  }, [unifiedFilteredByStatus, currentPage, perPage]);

  useEffect(() => {
    fetchAvailableCars();
  }, [fetchAvailableCars]);

  useEffect(() => {
    if (activeTab === "before" || activeTab === "all") {
      fetchAvailableCars();
    }
  }, [activeTab, fetchAvailableCars]);

  useEffect(() => {
    if (activeTab !== "all") return;
    const safe = Math.max(unifiedTotalPages, 1);
    if (currentPage > safe) {
      setCurrentPage(safe);
    }
  }, [activeTab, unifiedTotalPages, currentPage, setCurrentPage]);

  useEffect(() => {
    if (activeTab !== "all") return;
    setCurrentPage(1);
  }, [allTabStatusFilter, activeTab, setCurrentPage]);

  useEffect(() => {
    if (activeTab !== "all") {
      setAllTabStatusFilter("");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("status");
          return next;
        },
        { replace: true }
      );
    }
  }, [activeTab, setSearchParams]);

  // Normalize missing/invalid `tab` to default, and sync from URL.
  useEffect(() => {
    const t = searchParams.get("tab") as StockPageTab | null;
    if (!t || !allowedTabs.includes(t)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", defaultTab);
          return next;
        },
        { replace: true }
      );
      return;
    }
    setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), defaultTab]);

  const handleCreateStockFromCar = async (car: any) => {
    try {
      console.log("Creating stock from car:", car);
      const stockData = {
        car_id: car.id,
        quantity: 1,
        price: car.price_amount ? (typeof car.price_amount === "string" ? parseFloat(car.price_amount) : car.price_amount) : 0,
        notes: "",
      };

      console.log("Stock data to send:", stockData);
      const response = await stockApi.createStock(stockData);
      console.log("Create stock response:", response);

      if (response.success) {
        showMessage("success", "Stock added successfully");
        fetchStocks();
        fetchAvailableCars();
      } else {
        showMessage("error", response.message || "Failed to add stock");
      }
    } catch (error: any) {
      console.error("Error creating stock:", error);
      showMessage("error", error?.message || "Failed to add stock");
    }
  };

  const handleViewCar = (item: Stock | any) => {
    // For Stock items, the car data is nested in 'car' property
    // For AvailableCar items, the item itself is the car
    const carId = item.car ? item.car.id : item.id;
    navigate(`/car-view/${carId}`, {
      state: { returnStockTab: activeTab },
    });
  };

  const handleEditCar = (stock: Stock) => {
    if (stock.car?.id) {
      navigate(`/update-car/${stock.car.id}`, {
        state: { returnStockTab: activeTab },
      });
    }
  };

  const handleEditPendingCar = (car: { id: number }) => {
    const returnStockTab: StockPageTab =
      activeTab === "all" ? "all" : "before";
    navigate(`/update-car/${car.id}`, {
      state: { returnStockTab },
    });
  };

  const handleDeletePendingCar = (car: {
    id: number;
    make?: string;
    model?: string;
  }) => {
    setPendingCarToDelete(car);
    setShowPendingCarDeleteModal(true);
  };

  const confirmDeletePendingCar = async () => {
    if (!pendingCarToDelete) return;
    setIsDeletingPendingCar(true);
    try {
      await carApi.deleteCar(pendingCarToDelete.id);
      setShowPendingCarDeleteModal(false);
      setPendingCarToDelete(null);
      showMessage("success", "Car deleted successfully");
      await fetchAvailableCars();
      await fetchStocks();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to delete car";
      showMessage("error", msg);
    } finally {
      setIsDeletingPendingCar(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6 mb-6">
          <StockHeader
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("tab", tab);
                return next;
              });
            }}
            tabCounts={stockTabCounts}
            visibleTabs={allowedTabs}
            fromDateFilter={activeTab === "before" ? pendingFilters.fromDateFilter : fromDateFilter}
            onFromDateFilterChange={activeTab === "before" ? pendingFilters.setFromDateFilter : setFromDateFilter}
            toDateFilter={activeTab === "before" ? pendingFilters.toDateFilter : toDateFilter}
            onToDateFilterChange={activeTab === "before" ? pendingFilters.setToDateFilter : setToDateFilter}
          />

          {activeTab === "all" || activeTab === "current" ? (
            <StockFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearFilters={() => {
                handleClearFilters();
                handleStatusFilterChange("");
              }}
              showStatusFilter={activeTab === "all" || activeTab === "current"}
              disableStatusFilter={activeTab === "current"}
              statusFilter={allTabStatusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              makeFilter={makeFilter}
              onMakeFilterChange={setMakeFilter}
              modelFilter={modelFilter}
              onModelFilterChange={setModelFilter}
              colorFilter={colorFilter}
              onColorFilterChange={setColorFilter}
              fuelFilter={fuelFilter}
              onFuelFilterChange={setFuelFilter}
              fromDateFilter={fromDateFilter}
              onFromDateFilterChange={setFromDateFilter}
              toDateFilter={toDateFilter}
              onToDateFilterChange={setToDateFilter}
              isGeneratingPDF={
                activeTab === "current" && !isStockUserView ? isGeneratingPDF : false
              }
              onGeneratePDF={
                activeTab === "current" && !isStockUserView ? generatePDF : undefined
              }
              onCreateInvoice={() => setShowInvoiceModal(true)}
              onCreateStock={isStockUserView ? undefined : handleCreateStock}
              statusCounts={statusCounts}
              filterOptions={filterOptions}
              onAddCar={isStockUserView || activeTab === "current" ? undefined : handleAddStockClick}
            />
          ) : activeTab === "before" ? (
            <StockFilters
              searchTerm={pendingFilters.searchTerm}
              onSearchChange={pendingFilters.setSearchTerm}
              onClearFilters={pendingFilters.handleClearFilters}
              yearFilter={pendingFilters.yearFilter}
              onYearFilterChange={pendingFilters.setYearFilter}
              makeFilter={pendingFilters.makeFilter}
              onMakeFilterChange={pendingFilters.setMakeFilter}
              modelFilter={pendingFilters.modelFilter}
              onModelFilterChange={pendingFilters.setModelFilter}
              colorFilter={pendingFilters.colorFilter}
              onColorFilterChange={pendingFilters.setColorFilter}
              fuelFilter={pendingFilters.fuelFilter}
              onFuelFilterChange={pendingFilters.setFuelFilter}
              fromDateFilter={pendingFilters.fromDateFilter}
              onFromDateFilterChange={pendingFilters.setFromDateFilter}
              toDateFilter={pendingFilters.toDateFilter}
              onToDateFilterChange={pendingFilters.setToDateFilter}
              isGeneratingPDF={false}
              filterOptions={pendingFilters.filterOptions}
              searchPlaceholder="Search pending cars by make, model, year, ref no, chassis…"
              onAddCar={handleAddStockClick}
            />
          ) : null}
        </div>

        <MessageDisplay message={message} />

        {activeTab === "all" || activeTab === "current" ? (
          <>
            <StockTable
              stocks={activeTab === "all" ? [] : stocks}
              allStocks={scopedStocks}
              isLoading={
                activeTab === "all"
                  ? isLoading || isLoadingAvailableCars
                  : isLoading
              }
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEditCar}
              onDelete={handleDeleteStock}
              onView={handleViewCar}
              onRefresh={() => {
                fetchStocks();
                fetchAvailableCars();
              }}
              emptyStateVariant="default"
              showDelete={!isStockUserView}
              readOnly={isStockUserView}
              unifiedRows={activeTab === "all" ? unifiedPageRows : undefined}
              unifiedPendingCallbacks={
                activeTab === "all"
                  ? {
                    onView: handleViewCar,
                    onEdit: handleEditPendingCar,
                    onDelete: handleDeletePendingCar,
                    onCreateStock: handleCreateStockFromCar,
                  }
                  : undefined
              }
            />

            <Pagination
              currentPage={currentPage}
              totalPages={
                activeTab === "all" ? unifiedTotalPages : totalPages
              }
              totalItems={
                activeTab === "all" ? unifiedTotalItems : totalItems
              }
              perPage={perPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        ) : activeTab === "before" ? (
          <>
            <AvailableCarsTable
              cars={pendingFilters.paginatedCars as any[]}
              filteredAllCars={pendingFilters.filteredAllCars as any[]}
              apiHasCars={
                !isLoadingAvailableCars && availableCars.length > 0
              }
              sourceCount={pendingFilters.sourceCount}
              isLoading={isLoadingAvailableCars}
              onCreateStock={handleCreateStockFromCar}
              onView={handleViewCar}
              onEdit={handleEditPendingCar}
              onDelete={handleDeletePendingCar}
              onRefresh={fetchAvailableCars}
            />
            <Pagination
              currentPage={pendingFilters.currentPage}
              totalPages={pendingFilters.totalPages}
              totalItems={pendingFilters.totalItems}
              perPage={pendingFilters.perPage}
              onPageChange={(page) => pendingFilters.setCurrentPage(page)}
            />
          </>
        ) : null}

        {/* Chassis Verification Modal */}
        {showChassisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur effect */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setShowChassisModal(false)}
            />
            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 scale-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-5">
                <h3 className="text-xl font-bold">Add to Stock List</h3>
                <p className="text-primary-100 text-xs mt-1">
                  Enter the vehicle's chassis number to proceed.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleChassisSubmit} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="chassis_input"
                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    id="chassis_input"
                    value={chassisInput}
                    disabled={isCheckingChassis}
                    onChange={(e) => {
                      setChassisInput(e.target.value);
                      if (chassisError) setChassisError("");
                    }}
                    placeholder="Enter unique chassis number..."
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 font-semibold text-sm shadow-sm transition-all duration-200 ${
                      chassisError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } ${isCheckingChassis ? "opacity-50 cursor-not-allowed" : ""}`}
                    autoFocus
                  />
                  {chassisError && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                      <svg
                        className="w-4 h-4 shrink-0 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>{chassisError}</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isCheckingChassis}
                    onClick={() => setShowChassisModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl transition-colors border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckingChassis}
                    className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary-600/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isCheckingChassis && (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {isCheckingChassis ? "Validating..." : "Proceed"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Stock Popup - Commented out */}
        {/* <StockDrawer
          isOpen={showDrawer}
          onClose={handleDrawerClose}
          title={drawerMode === "create" ? "Create New Stock" : "Edit Stock"}
          size="md"
          showActions={false}
        >
          <StockDrawerForm
            stock={selectedStock}
            onSubmit={handleDrawerSubmit}
            onCancel={handleDrawerClose}
            isLoading={false}
            onError={(error) => showMessage("error", error)}
          />
        </StockDrawer> */}

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Stock"
          message={`Are you sure you want to delete this stock item? This action cannot be undone.`}
          isLoading={isDeleting}
        />

        <DeleteConfirmationModal
          isOpen={showPendingCarDeleteModal}
          onClose={() => {
            setShowPendingCarDeleteModal(false);
            setPendingCarToDelete(null);
          }}
          onConfirm={confirmDeletePendingCar}
          title="Delete Car"
          message={
            pendingCarToDelete
              ? `Are you sure you want to delete ${[
                pendingCarToDelete.make,
                pendingCarToDelete.model,
              ]
                .filter(Boolean)
                .join(" ") || `car #${pendingCarToDelete.id}`}? This action cannot be undone.`
              : "Are you sure you want to delete this car? This action cannot be undone."
          }
          isLoading={isDeletingPendingCar}
        />

        {/* <InvoiceCreationModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onCreateInvoice={handleCreateInvoice}
        /> */}
      </div>
    </div>
  );
};

export default StockManagement;
