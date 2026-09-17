import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, X, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import {
  purchaseHistoryApi,
  PurchaseHistory,
} from "../../services/purchaseHistoryApi";
import PurchaseHistoryTable from "../../components/purchase-history/PurchaseHistoryTable";
import PurchaseHistoryLCView from "../../components/purchase-history/PurchaseHistoryLCView";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import Pagination from "../../components/car/Pagination";

const PurchaseHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchaseHistories, setPurchaseHistories] = useState<PurchaseHistory[]>(
    []
  );
  const [lcHistoriesAll, setLcHistoriesAll] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseHistoryToDelete, setPurchaseHistoryToDelete] =
    useState<PurchaseHistory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  type PurchaseTab = "history" | "lc_wise";
  const allowedTabs: PurchaseTab[] = ["lc_wise", "history"];
  const tabParam = searchParams.get("tab");
  const initialTab: PurchaseTab =
    tabParam && allowedTabs.includes(tabParam as PurchaseTab)
      ? (tabParam as PurchaseTab)
      : "lc_wise";

  const [activeTab, setActiveTab] = useState<PurchaseTab>(initialTab);

  // Sync tab from URL (`/admin/purchase-history?tab=lc_wise|history`).
  useEffect(() => {
    const t = searchParams.get("tab") as PurchaseTab | null;
    if (!t) return;
    if (!allowedTabs.includes(t)) return;
    setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const [monthSearch, setMonthSearch] = useState("");
  const [yearSearch, setYearSearch] = useState("");

  const monthRef = React.useRef<HTMLDivElement>(null);
  const yearRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (monthRef.current && !monthRef.current.contains(target)) {
        setMonthOpen(false);
        setMonthSearch("");
      }
      if (yearRef.current && !yearRef.current.contains(target)) {
        setYearOpen(false);
        setYearSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const HISTORY_PER_PAGE = 15;
  const LC_PER_PAGE = 10;
  // Frontend LC-wise pagination needs a complete enough dataset to group by `lc_number`.
  // Increase this if you have many LC groups and still see missing groups.
  const LC_FETCH_PER_PAGE = 1000;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  type GetPurchaseHistoriesParams = NonNullable<
    Parameters<typeof purchaseHistoryApi.getPurchaseHistories>[0]
  >;

  useEffect(() => {
    // When switching tab or changing filters/search, always restart pagination.
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterMonth, filterYear]);

  useEffect(() => {
    if (activeTab !== "history") return;
    fetchHistoryPurchaseHistories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, searchTerm, filterMonth, filterYear]);

  useEffect(() => {
    fetchLcHistoriesAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterMonth, filterYear]);

  const fetchHistoryPurchaseHistories = async () => {
    try {
      setLoading(true);
      const params: GetPurchaseHistoriesParams = {
        page: currentPage,
        per_page: HISTORY_PER_PAGE,
        sort_by: "created_at",
        sort_order: "desc",
      };

      if (searchTerm) params.search = searchTerm;
      if (filterMonth) params.lc_month = filterMonth;
      if (filterYear) params.lc_year = filterYear;

      const response = await purchaseHistoryApi.getPurchaseHistories(params);

      setPurchaseHistories(response.data || []);
      setTotalPages(response.last_page || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error fetching purchase histories:", error);
      toast.error("Failed to fetch purchase histories");
    } finally {
      setLoading(false);
    }
  };

  const fetchLcHistoriesAll = async () => {
    try {
      setLoading(true);
      const params: GetPurchaseHistoriesParams = {
        page: 1,
        per_page: LC_FETCH_PER_PAGE,
        sort_by: "created_at",
        sort_order: "desc",
      };

      if (searchTerm) params.search = searchTerm;
      if (filterMonth) params.lc_month = filterMonth;
      if (filterYear) params.lc_year = filterYear;

      const response = await purchaseHistoryApi.getPurchaseHistories(params);
      setLcHistoriesAll(response.data || []);
    } catch (error) {
      console.error("Error fetching LC-wise purchase histories:", error);
      toast.error("Failed to fetch purchase history (LC-wise)");
    } finally {
      setLoading(false);
    }
  };

  const groupedByLC = useMemo(() => {
    const groups: Record<string, PurchaseHistory[]> = {};
    lcHistoriesAll.forEach((ph) => {
      const lc = ph.lc_number || "No LC Number";
      if (!groups[lc]) groups[lc] = [];
      groups[lc].push(ph);
    });
    return groups;
  }, [lcHistoriesAll]);

  const lcKeys = useMemo(() => Object.keys(groupedByLC), [groupedByLC]);
  const lcTotalPages = Math.max(Math.ceil(lcKeys.length / LC_PER_PAGE), 1);
  const lcTotalItems = lcKeys.length;

  useEffect(() => {
    if (activeTab !== "lc_wise") return;
    // Clamp page if filters reduced total LC groups.
    if (currentPage > lcTotalPages) setCurrentPage(lcTotalPages);
  }, [activeTab, currentPage, lcTotalPages]);

  const pagedLcKeys = useMemo(() => {
    const start = (currentPage - 1) * LC_PER_PAGE;
    return lcKeys.slice(start, start + LC_PER_PAGE);
  }, [currentPage, lcKeys]);

  const lcPurchaseHistoriesForPage = useMemo(() => {
    const items: PurchaseHistory[] = [];
    pagedLcKeys.forEach((lcKey) => {
      items.push(...(groupedByLC[lcKey] || []));
    });
    return items;
  }, [pagedLcKeys, groupedByLC]);

  const handleCreate = () => {
    navigate("/admin/purchase-history/create", {
      state: { returnPurchaseTab: activeTab },
    });
  };

  const handleAddUnderLc = (template: PurchaseHistory) => {
    navigate("/admin/purchase-history/create", {
      state: { lcTemplate: template, returnPurchaseTab: activeTab },
    });
  };

  const handleView = (purchaseHistory: PurchaseHistory) => {
    navigate(`/admin/purchase-history/view/${purchaseHistory.id}`, {
      state: { returnPurchaseTab: activeTab },
    });
  };

  const handleEdit = (purchaseHistory: PurchaseHistory | PurchaseHistory[]) => {
    if (Array.isArray(purchaseHistory)) {
      navigate("/admin/purchase-history/edit/bulk", {
        state: { records: purchaseHistory, returnPurchaseTab: activeTab },
      });
    } else {
      navigate(`/admin/purchase-history/edit/${purchaseHistory.id}`, {
        state: { returnPurchaseTab: activeTab },
      });
    }
  };

  const handleDelete = (purchaseHistory: PurchaseHistory) => {
    setPurchaseHistoryToDelete(purchaseHistory);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!purchaseHistoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await purchaseHistoryApi.deletePurchaseHistory(
        purchaseHistoryToDelete.id
      );
      if (response.success) {
        toast.success("Purchase history deleted successfully");
        if (activeTab === "history") {
          fetchHistoryPurchaseHistories();
        } else {
          fetchLcHistoriesAll();
        }
        setShowDeleteModal(false);
        setPurchaseHistoryToDelete(null);
      } else {
        toast.error(response.message || "Failed to delete purchase history");
      }
    } catch (error) {
      console.error("Error deleting purchase history:", error);
      toast.error("Failed to delete purchase history");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterMonth("");
    setFilterYear("");
    setCurrentPage(1);
  };

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  const hasActiveFilters = searchTerm || filterMonth || filterYear;

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6 mb-6">
          {/* Header - aligned with Stock page style */}
          <div className="p-0 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">
                  Purchases / Purchase History
                </h1>
              </div>
              {/* Tab Selection - LC wise first (default) */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    setActiveTab("lc_wise");
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("tab", "lc_wise");
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "lc_wise"
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <span>LC History</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${activeTab === "lc_wise"
                      ? "bg-white text-primary-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {lcTotalItems}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("history");
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("tab", "history");
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "history"
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <span>Purchase History</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${activeTab === "history"
                      ? "bg-white text-primary-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {lcHistoriesAll.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters - aligned with Stock page top section */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by LC number, invoice number, bank name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Month Filter */}
            <div className="w-full lg:w-auto relative" ref={monthRef}>
              <button
                type="button"
                onClick={() => setMonthOpen(!monthOpen)}
                className="w-full lg:w-auto min-w-[150px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 hover:border-gray-400 transition-all font-semibold text-sm shadow-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {months.find((m) => m.value === filterMonth)?.label || "All Months"}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${monthOpen ? "rotate-180" : ""}`} />
              </button>

              {monthOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
                  <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search months..."
                      value={monthSearch}
                      onChange={(e) => setMonthSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-48 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMonth("");
                        setMonthOpen(false);
                        setMonthSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!filterMonth ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      <span>All Months</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    {months
                      .filter(({ label }) => label.toLowerCase().includes(monthSearch.toLowerCase()))
                      .map(({ value, label }) => {
                        const isSelected = filterMonth === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setFilterMonth(value);
                              setMonthOpen(false);
                              setMonthSearch("");
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                          >
                            <span>{label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Year Filter */}
            <div className="w-full lg:w-auto relative" ref={yearRef}>
              <button
                type="button"
                onClick={() => setYearOpen(!yearOpen)}
                className="w-full lg:w-auto min-w-[120px] flex items-center justify-between px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 hover:border-gray-400 transition-all font-semibold text-sm shadow-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {filterYear || "All Years"}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${yearOpen ? "rotate-180" : ""}`} />
              </button>

              {yearOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 max-h-80 flex flex-col backdrop-blur-md bg-opacity-95">
                  <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search years..."
                      value={yearSearch}
                      onChange={(e) => setYearSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-48 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterYear("");
                        setYearOpen(false);
                        setYearSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!filterYear ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      <span>All Years</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    {years
                      .filter((y) => y.includes(yearSearch))
                      .map((y) => {
                        const isSelected = filterYear === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => {
                              setFilterYear(y);
                              setYearOpen(false);
                              setYearSearch("");
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'font-bold bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                          >
                            <span>{y}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="Clear Filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Purchase History
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "history" ? (
          <PurchaseHistoryTable
            purchaseHistories={purchaseHistories}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onRefresh={fetchHistoryPurchaseHistories}
          />
        ) : (
          <PurchaseHistoryLCView
            purchaseHistories={lcPurchaseHistoriesForPage}
            isLoading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddUnderLc={handleAddUnderLc}
          />
        )}

        {/* Pagination - same as Car page */}
        {/*
          In `lc_wise`, pagination is by LC groups (cards), not by raw purchase-history rows.
        */}
        {(() => {
          const paginationTotalPages =
            activeTab === "lc_wise" ? lcTotalPages : totalPages;
          const paginationTotalItems =
            activeTab === "lc_wise" ? lcTotalItems : totalItems;
          const paginationPerPage =
            activeTab === "lc_wise" ? LC_PER_PAGE : HISTORY_PER_PAGE;

          return (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              totalItems={paginationTotalItems}
              perPage={paginationPerPage}
              onPageChange={setCurrentPage}
            />
          );
        })()}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Purchase History"
          message={`Are you sure you want to delete purchase history #${purchaseHistoryToDelete?.id}? This action cannot be undone.`}
          onClose={() => {
            setShowDeleteModal(false);
            setPurchaseHistoryToDelete(null);
          }}
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default PurchaseHistoryPage;
