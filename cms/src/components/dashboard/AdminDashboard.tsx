import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingCartIcon,
    CarIcon,
    PackageIcon,
    ActivityIcon,
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    FileTextIcon,
    CreditCardIcon,
    RefreshCwIcon,
    AlertCircleIcon,
    DollarSignIcon,
    Calendar,
    X,
    ChevronDown,
    Users
} from "lucide-react";
import { DashboardData } from "../../services/dashboardApi";
import { getEffectiveStockStatus } from "../../utils/stockStatus";

export const BdtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span
        className={`inline-flex items-center justify-center font-extrabold leading-none text-lg text-current ${className ?? ""
            }`}
    >
        ৳
    </span>
);

interface AdminDashboardProps {
    data: DashboardData | null;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    data,
    isLoading,
    error,
    onRefresh,
}) => {
    // 1. Declare ALL hooks at the very top
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [purchaseFromDate, setPurchaseFromDate] = useState<string>("");
    const [purchaseToDate, setPurchaseToDate] = useState<string>("");
    const [purchaseSearchQuery, setPurchaseSearchQuery] = useState<string>("");
    const [expandedLcs, setExpandedLcs] = useState<Record<string, boolean>>({});

    // Date filter helper for sales payments
    const isWithinRange = (dateStr: string | null | undefined) => {
        if (!dateStr) return true;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return true;

        if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (date < from) return false;
        }
        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (date > to) return false;
        }
        return true;
    };

    // Date filter helper for purchases
    const isWithinPurchaseRange = (dateStr: string | null | undefined) => {
        if (!dateStr) return true;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return true;

        if (purchaseFromDate) {
            const from = new Date(purchaseFromDate);
            from.setHours(0, 0, 0, 0);
            if (date < from) return false;
        }
        if (purchaseToDate) {
            const to = new Date(purchaseToDate);
            to.setHours(23, 59, 59, 999);
            if (date > to) return false;
        }
        return true;
    };

    // Helper to extract car chassis details from purchase history
    const getChassisDetails = (purchase: any) => {
        if (purchase.cars && purchase.cars.length > 0) {
            return purchase.cars.map((c: any) => c.chassis_no_full || c.chassis_no_masked).filter(Boolean).join(", ");
        }
        if (purchase.car) {
            return purchase.car.chassis_no_full || purchase.car.chassis_no_masked || "N/A";
        }
        return "N/A";
    };

    // Helper to extract car make/model details from purchase history
    const getCarDetails = (purchase: any) => {
        if (purchase.cars && purchase.cars.length > 0) {
            return purchase.cars.map((c: any) => `${c.make} ${c.model}`).join(", ");
        }
        if (purchase.car) {
            return `${purchase.car.make} ${purchase.car.model}`;
        }
        return "N/A";
    };

    // Filter payments list dynamically by date wise range and search query
    const filteredPayments = useMemo(() => {
        if (!data || !data.payments) return [];
        return data.payments.filter(pm => {
            const matchesDate = isWithinRange(pm.purchase_date);

            const showroom = (pm.showroom_name || "").toLowerCase();
            const customer = (pm.customer_name || "").toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = query === "" || showroom.includes(query) || customer.includes(query);

            return matchesDate && matchesSearch;
        });
    }, [data, fromDate, toDate, searchQuery]);

    // Filter purchases list dynamically by date wise range and search query
    const filteredPurchasesList = useMemo(() => {
        if (!data || !data.purchases) return [];
        return data.purchases.filter(purchase => {
            const matchesDate = isWithinPurchaseRange(purchase.purchase_date || purchase.lc_date);

            const lcNumber = (purchase.lc_number || "").toLowerCase();
            const bankName = (purchase.lc_bank_name || "").toLowerCase();
            const carText = getCarDetails(purchase).toLowerCase();
            const chassisText = getChassisDetails(purchase).toLowerCase();
            const query = purchaseSearchQuery.toLowerCase().trim();

            const matchesSearch = query === "" ||
                lcNumber.includes(query) ||
                bankName.includes(query) ||
                carText.includes(query) ||
                chassisText.includes(query);

            return matchesDate && matchesSearch;
        });
    }, [data, purchaseFromDate, purchaseToDate, purchaseSearchQuery]);

    // Group purchases by LC Number so we don't show separate cards for the same LC
    const groupedLcs = useMemo(() => {
        const groups: Record<string, {
            id: string;
            lc_number: string;
            lc_bank_name: string | null;
            lc_date: string | null;
            total_amount: number;
            purchase_date: string | null;
            cars: Array<{
                id: number;
                make: string;
                model: string;
                chassis_no_full?: string | null;
                chassis_no_masked?: string | null;
            }>;
        }> = {};

        filteredPurchasesList.forEach((purchase) => {
            const lcKey = purchase.lc_number || "Direct Purchase";

            // Extract cars
            const purchaseCars: any[] = [];
            if (purchase.cars && purchase.cars.length > 0) {
                purchaseCars.push(...purchase.cars);
            } else if (purchase.car) {
                purchaseCars.push(purchase.car);
            }

            if (!groups[lcKey]) {
                groups[lcKey] = {
                    id: lcKey,
                    lc_number: purchase.lc_number || "",
                    lc_bank_name: purchase.lc_bank_name,
                    lc_date: purchase.lc_date,
                    total_amount: 0,
                    purchase_date: purchase.purchase_date,
                    cars: [],
                };
            }

            // Safe numeric parsing to avoid string concatenation
            groups[lcKey].total_amount += Number(purchase.purchase_amount) || 0;

            purchaseCars.forEach(car => {
                if (car && !groups[lcKey].cars.some(c => c.id === car.id)) {
                    groups[lcKey].cars.push({
                        id: car.id,
                        make: car.make,
                        model: car.model,
                        chassis_no_full: car.chassis_no_full,
                        chassis_no_masked: car.chassis_no_masked,
                    });
                }
            });
        });

        return Object.values(groups);
    }, [filteredPurchasesList]);

    // Show only the top 5 LC cards
    const displayedLcs = useMemo(() => {
        return groupedLcs.slice(0, 5);
    }, [groupedLcs]);

    const navigate = useNavigate();

    // Group stocks by status for statistics (aligned with Stock page logic)
    const carStatusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            pending: Number(data?.availableCars) || 0,
            available: 0,
            sold: 0,
            reserved: 0,
            in_transit: 0,
            preorder: 0,
            damaged: 0,
            lost: 0,
            stolen: 0
        };

        if (data && data.stocks) {
            data.stocks.forEach(stock => {
                const status = getEffectiveStockStatus(stock);
                if (status && counts[status] !== undefined) {
                    counts[status]++;
                }
            });
        }

        return counts;
    }, [data]);

    const handleStatusCardClick = (status: string) => {
        navigate(`/admin/stock?tab=all&status=${status}`);
    };

    // 2. Early return templates for Loading & Error ONLY after hooks have been defined
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900/50 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 dark:text-gray-400 font-medium animate-pulse">Loading administrative analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-gray-950">
                <div className="text-center max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900/50">
                        <ActivityIcon className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Dashboard offline
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm">
                        {error || "We're having trouble retrieving the latest metrics. Please check your network connection."}
                    </p>
                    <button
                        onClick={onRefresh}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <RefreshCwIcon className="w-4 h-4" />
                        Reconnect Now
                    </button>
                </div>
            </div>
        );
    }

    const toggleLcExpanded = (id: string) => {
        setExpandedLcs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Helper to calculate ordinal suffix for installments
    const getOrdinalSuffix = (num: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = num % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    // Dynamic calculations based on filtered payments (Safe cast to Number)
    const totalPaymentPurchaseAmount = filteredPayments.reduce((sum, item) => sum + (Number(item.purchase_amount) || 0), 0);
    const totalPaidAmount = filteredPayments.reduce((sum, payment) => {
        const installmentsSum = payment.installments?.reduce((iSum, inst) => iSum + (Number(inst.amount) || 0), 0) || 0;
        return sum + installmentsSum;
    }, 0);
    const totalDueAmount = Math.max(0, totalPaymentPurchaseAmount - totalPaidAmount);
    const paidPercentage = totalPaymentPurchaseAmount > 0
        ? Math.round((totalPaidAmount / totalPaymentPurchaseAmount) * 100)
        : 0;

    // All-time calculations (unaffected by filter)
    const totalStockValue = Number(data.totalStockValue) || 0;
    const totalStock = Number(data.totalStock) || 0;
    const availableCars = Number(data.availableCars) || 0;
    const soldCars = Number(data.soldCars) || 0;
    const avgCarValue = totalStock > 0 ? Math.round(totalStockValue / totalStock) : 0;

    const totalCarsSystem = (data?.stocks?.length || 0) + (Number(data?.availableCars) || 0);

    const totalPurchaseAmount = Number(data.totalPurchaseAmount) || 0;
    const totalCnfAmount = Number(data.totalCnfAmount) || 0;
    const totalLcsCount = Number(data.totalLcsCount) || 0;

    return (
        <div className="min-h-screen text-slate-800 dark:text-slate-200">
            <div className="max-w-full mx-auto px-4 pb-6 space-y-6">

                {/* Dashboard Card Container (matches Stock page main card) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 sm:p-6 mb-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h1 className="text-2xl font-bold text-primary-600">
                                Dashboard / System Overview
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Real-time metrics for inventory, purchases, and payments.
                            </p>
                        </div>

                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850 transition-all duration-200"
                        >
                            <RefreshCwIcon className="w-4 h-4 text-primary-500" />
                            Refresh
                        </button>
                    </div>

                    {/* Stats & Overview Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Users Summary Card Column */}
                        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 rounded-2xl border border-primary-100/50 dark:border-primary-900/30">
                            <div className="p-4 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20 mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">Total Users</span>
                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
                                {data.totalUsers ?? 0}
                            </span>
                        </div>

                        {/* Car Status Stats Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-gray-700">
                                <div className="p-2 bg-indigo-500 text-white rounded-lg">
                                    <CarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Car Status Breakdown</h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Total cars in system: {totalCarsSystem}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                    {
                                        key: "pending",
                                        label: "Pending",
                                        bgColor: "bg-amber-50/50 dark:bg-amber-950/10",
                                        borderColor: "border-amber-100/50 dark:border-amber-900/20",
                                        textColor: "text-amber-600 dark:text-amber-400"
                                    },
                                    {
                                        key: "preorder",
                                        label: "Preorder",
                                        bgColor: "bg-rose-50/50 dark:bg-rose-950/10",
                                        borderColor: "border-rose-100/50 dark:border-rose-900/20",
                                        textColor: "text-rose-600 dark:text-rose-400"
                                    },
                                    {
                                        key: "in_transit",
                                        label: "In Transit",
                                        bgColor: "bg-purple-50/50 dark:bg-purple-950/10",
                                        borderColor: "border-purple-100/50 dark:border-purple-900/20",
                                        textColor: "text-purple-600 dark:text-purple-400"
                                    },
                                    {
                                        key: "available",
                                        label: "Available",
                                        bgColor: "bg-emerald-50/50 dark:bg-emerald-950/10",
                                        borderColor: "border-emerald-100/50 dark:border-emerald-900/20",
                                        textColor: "text-emerald-600 dark:text-emerald-400"
                                    },
                                    {
                                        key: "reserved",
                                        label: "Reserved",
                                        bgColor: "bg-teal-50/50 dark:bg-teal-950/10",
                                        borderColor: "border-teal-100/50 dark:border-teal-900/20",
                                        textColor: "text-teal-600 dark:text-teal-400"
                                    },
                                    {
                                        key: "damaged",
                                        label: "Damaged",
                                        bgColor: "bg-orange-50/50 dark:bg-orange-950/10",
                                        borderColor: "border-orange-100/50 dark:border-orange-900/20",
                                        textColor: "text-orange-600 dark:text-orange-400"
                                    },
                                    {
                                        key: "lost",
                                        label: "Lost",
                                        bgColor: "bg-slate-100/50 dark:bg-slate-900/20",
                                        borderColor: "border-slate-200/50 dark:border-slate-800/20",
                                        textColor: "text-slate-650 dark:text-slate-400"
                                    },
                                    {
                                        key: "stolen",
                                        label: "Stolen",
                                        bgColor: "bg-red-50/50 dark:bg-red-950/10",
                                        borderColor: "border-red-100/50 dark:border-red-900/20",
                                        textColor: "text-red-600 dark:text-red-400"
                                    },
                                    {
                                        key: "sold",
                                        label: "Sold",
                                        bgColor: "bg-blue-50/50 dark:bg-blue-950/10",
                                        borderColor: "border-blue-100/50 dark:border-blue-900/20",
                                        textColor: "text-blue-600 dark:text-blue-400"
                                    }
                                ].map((cfg) => (
                                    <div
                                        key={cfg.key}
                                        onClick={() => handleStatusCardClick(cfg.key)}
                                        className={`p-4 ${cfg.bgColor} rounded-xl border ${cfg.borderColor} flex flex-col cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-md`}
                                    >
                                        <span className={`text-xs font-semibold ${cfg.textColor}`}>{cfg.label}</span>
                                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                            {carStatusCounts[cfg.key] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Sub Lists Sections - Stacked Vertically */}
                <div className="space-y-6 mt-6">

                    {/* SECTION 1: Import & Purchase Details (Grouped LCs, Max 5 Cards Shown) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 flex flex-col h-[440px]">

                        {/* Header of the Import & Purchase parts containing Title, Search, and Date Picker */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 flex-shrink-0 pb-4 border-b border-slate-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                                    <FileTextIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Import & Purchase Details
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Detailed logs of LCs, custom duties, and imports</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search LC/bank/chassis..."
                                        value={purchaseSearchQuery}
                                        onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                                        className="w-[200px] sm:w-[240px] bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-250 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    {purchaseSearchQuery && (
                                        <button
                                            onClick={() => setPurchaseSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Date Picker Filter Section */}
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2 shadow-sm transition-all" title="Purchases Date Filter">
                                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />

                                    {/* From Date */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">From</span>
                                        <input
                                            type="date"
                                            value={purchaseFromDate}
                                            onChange={(e) => setPurchaseFromDate(e.target.value)}
                                            onClick={(e) => {
                                                try {
                                                    (e.target as any).showPicker();
                                                } catch (err) { }
                                            }}
                                            className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                        />
                                    </div>

                                    {/* Divider */}
                                    <span className="text-gray-300 dark:text-gray-700 font-light mx-0.5">|</span>

                                    {/* To Date */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">To</span>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setPurchaseToDate(e.target.value)}
                                            onClick={(e) => {
                                                try {
                                                    (e.target as any).showPicker();
                                                } catch (err) { }
                                            }}
                                            className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                        />
                                    </div>

                                    {(purchaseFromDate || purchaseToDate) && (
                                        <button
                                            onClick={() => { setPurchaseFromDate(""); setPurchaseToDate(""); }}
                                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Clear filters"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List Section showing exactly 3 LC cards (1 row) in a responsive grid layout */}
                        <div className="flex-grow overflow-y-auto pr-2 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-800">
                            {displayedLcs.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-500 dark:text-gray-400">No matching purchase records found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {displayedLcs.map((lcGroup) => {
                                        const isExpanded = !!expandedLcs[lcGroup.id];
                                        const carCount = lcGroup.cars.length;

                                        return (
                                            <div key={lcGroup.id} className="p-5 bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-slate-200 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all duration-205 flex flex-col justify-between space-y-4 h-fit">

                                                {/* Top Header of Card */}
                                                <div className="flex justify-between items-start pb-2.5 border-b border-slate-200/60 dark:border-gray-850">
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-base">
                                                            LC: {lcGroup.lc_number || "Direct Purchase"}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-500 mt-0.5">
                                                            {lcGroup.lc_bank_name || "N/A"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-semibold bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-770">
                                                        {lcGroup.purchase_date || "N/A"}
                                                    </span>
                                                </div>

                                                {/* Card Body */}
                                                <div className="space-y-3.5 text-xs text-slate-600 dark:text-gray-400">
                                                    {/* LC Date & Total */}
                                                    <div className="grid grid-cols-2 gap-x-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">LC Date</span>
                                                            <span className="font-semibold text-slate-800 dark:text-gray-200 mt-0.5">
                                                                {lcGroup.lc_date || "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                                                            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                                                                ৳{lcGroup.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Expand Toggle Button */}
                                                    <button
                                                        onClick={() => toggleLcExpanded(lcGroup.id)}
                                                        className="w-full text-center text-xs font-semibold py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/50 dark:border-gray-700/50"
                                                    >
                                                        <span>{isExpanded ? "Hide Cars" : `View Cars (${carCount})`}</span>
                                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {/* Expanded Chassis / Car list section */}
                                                    {isExpanded && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-gray-800/80 space-y-2.5 animate-fadeIn">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Cars under this LC</span>
                                                            <div className="space-y-2">
                                                                {lcGroup.cars.map((c: any, cIdx: number) => (
                                                                    <div key={c.id || cIdx} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 flex flex-col gap-1 text-[11px] shadow-sm">
                                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                                            {c.make} {c.model}
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                                                            <span>Chassis:</span>
                                                                            <span className="font-semibold text-slate-700 dark:text-gray-300">{c.chassis_no_full || c.chassis_no_masked || "N/A"}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: Sales & Payment Details (Single Card Section, Full-Width Responsive Grid) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 flex flex-col h-[440px]">

                        {/* Header of the Sales Parts containing Title, Search, and Date Picker */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 flex-shrink-0 pb-4 border-b border-slate-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500 dark:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                    <CreditCardIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Sales & Payment Details
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Detailed logs of customer accounts and installments</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search showroom/customer..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-[200px] sm:w-[240px] bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-250 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Date Picker Filter Section */}
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2 shadow-sm transition-all" title="Sales & Payments Date Filter">
                                    <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />

                                    {/* From Date */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">From</span>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            onClick={(e) => {
                                                try {
                                                    (e.target as any).showPicker();
                                                } catch (err) { }
                                            }}
                                            className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                        />
                                    </div>

                                    {/* Divider */}
                                    <span className="text-gray-300 dark:text-gray-700 font-light mx-0.5">|</span>

                                    {/* To Date */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">To</span>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            onClick={(e) => {
                                                try {
                                                    (e.target as any).showPicker();
                                                } catch (err) { }
                                            }}
                                            className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                        />
                                    </div>

                                    {(fromDate || toDate) && (
                                        <button
                                            onClick={() => { setFromDate(""); setToDate(""); }}
                                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Clear filters"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List Section in a beautiful responsive grid layout with a scrollbar */}
                        <div className="flex-grow overflow-y-auto pr-2 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-800">
                            {filteredPayments.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-500 dark:text-gray-400">No matching sales records found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPayments.map((payment) => {
                                        const installments = payment.installments || [];
                                        const totalPaid = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                                        const remainingBalance = (Number(payment.purchase_amount) || 0) - totalPaid;

                                        return (
                                            <div key={payment.id} className="p-5 bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-slate-200 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all duration-205 flex flex-col justify-between space-y-4">
                                                <div className="flex justify-between items-start pb-2.5 border-b border-slate-200/60 dark:border-gray-850">
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-base">
                                                            {payment.showroom_name || payment.customer_name || "Direct Customer"}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-500 mt-0.5">Showroom / Client Account</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-semibold bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-770">{payment.purchase_date || "N/A"}</span>
                                                </div>

                                                <div className="space-y-2.5 text-xs text-slate-600 dark:text-gray-400">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">Purchase Amount:</span>
                                                        <span className="font-bold text-slate-900 dark:text-white text-right">
                                                            BDT {(Number(payment.purchase_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    {/* Dynamic Installments List */}
                                                    <div className="space-y-1.5 border-t border-slate-200/40 dark:border-gray-800/50 pt-2.5">
                                                        {installments.map((inst, index) => (
                                                            <div key={inst.id || index} className="flex justify-between items-center">
                                                                <span className="font-medium">{index + 1}{getOrdinalSuffix(index + 1)} Installment:</span>
                                                                <span className="font-semibold text-slate-800 dark:text-gray-200 text-right">
                                                                    BDT {(Number(inst.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {installments.length === 0 && (
                                                            <>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">1st Installment:</span>
                                                                    <span className="font-semibold text-slate-400 text-right">N/A</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">2nd Installment:</span>
                                                                    <span className="font-semibold text-slate-400 text-right">N/A</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {installments.length === 1 && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">2nd Installment:</span>
                                                                <span className="font-semibold text-slate-400 text-right">N/A</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center font-bold text-slate-700 dark:text-gray-300 border-t border-slate-255 dark:border-gray-800 pt-2.5 mt-2">
                                                        <span>Remaining Balance:</span>
                                                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-right">
                                                            BDT {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
