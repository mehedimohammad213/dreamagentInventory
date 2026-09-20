"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CarIcon,
    PackageIcon,
    CreditCardIcon,
    RefreshCwIcon,
    ActivityIcon,
    Calendar,
    X,
    ArrowUpRightIcon,
} from "lucide-react";
import { UserDashboardData } from "../../services/dashboardApi";
import { getEffectiveStockStatus } from "../../utils/stockStatus";

export const BdtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span
        className={`inline-flex items-center justify-center font-extrabold leading-none text-lg text-current ${className ?? ""
            }`}
    >
        ৳
    </span>
);

interface UserDashboardProps {
    data: UserDashboardData | null;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
}

const getOrdinalSuffix = (num: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

export const UserDashboard: React.FC<UserDashboardProps> = ({
    data,
    isLoading,
    error,
    onRefresh,
}) => {
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredPayments = useMemo(() => {
        if (!data?.payments) return [];
        return data.payments.filter((pm) => {
            const matchesDate = isWithinRange(pm.purchase_date);
            const showroom = (pm.showroom_name || "").toLowerCase();
            const customer = (pm.customer_name || "").toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                query === "" ||
                showroom.includes(query) ||
                customer.includes(query);
            return matchesDate && matchesSearch;
        });
    }, [data, fromDate, toDate, searchQuery]);

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
            stolen: 0,
        };

        if (data?.stocks) {
            data.stocks.forEach((stock) => {
                const status = getEffectiveStockStatus(stock);
                if (status && counts[status] !== undefined) {
                    counts[status]++;
                }
            });
        }

        return counts;
    }, [data]);

    const totalPaymentPurchaseAmount = filteredPayments.reduce(
        (sum, item) => sum + (Number(item.purchase_amount) || 0),
        0
    );
    const totalPaidAmount = filteredPayments.reduce((sum, payment) => {
        const installmentsSum =
            payment.installments?.reduce(
                (iSum, inst) => iSum + (Number(inst.amount) || 0),
                0
            ) || 0;
        return sum + installmentsSum;
    }, 0);
    const totalDueAmount = Math.max(
        0,
        totalPaymentPurchaseAmount - totalPaidAmount
    );
    const paidPercentage =
        totalPaymentPurchaseAmount > 0
            ? Math.round((totalPaidAmount / totalPaymentPurchaseAmount) * 100)
            : 0;

    const totalCarsSystem =
        (data?.stocks?.length || 0) + (Number(data?.availableCars) || 0);

    const handleStatusCardClick = (status: string) => {
        navigate(`/admin/stock?tab=current&status=${status}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900/50 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 dark:text-gray-400 font-medium animate-pulse">
                        Loading dashboard...
                    </p>
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
                        {error ||
                            "We're having trouble retrieving stock and payment metrics."}
                    </p>
                    <button
                        onClick={onRefresh}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <RefreshCwIcon className="w-4 h-4" />
                        Reconnect Now
                    </button>
                </div>
            </div>
        );
    }

    const statusCards = [
        {
            key: "pending",
            label: "Pending",
            bgColor: "bg-amber-50/50 dark:bg-amber-950/10",
            borderColor: "border-amber-100/50 dark:border-amber-900/20",
            textColor: "text-amber-600 dark:text-amber-400",
        },
        {
            key: "preorder",
            label: "Preorder",
            bgColor: "bg-rose-50/50 dark:bg-rose-950/10",
            borderColor: "border-rose-100/50 dark:border-rose-900/20",
            textColor: "text-rose-600 dark:text-rose-400",
        },
        {
            key: "in_transit",
            label: "In Transit",
            bgColor: "bg-purple-50/50 dark:bg-purple-950/10",
            borderColor: "border-purple-100/50 dark:border-purple-900/20",
            textColor: "text-purple-600 dark:text-purple-400",
        },
        {
            key: "available",
            label: "Available",
            bgColor: "bg-emerald-50/50 dark:bg-emerald-950/10",
            borderColor: "border-emerald-100/50 dark:border-emerald-900/20",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            key: "reserved",
            label: "Reserved",
            bgColor: "bg-teal-50/50 dark:bg-teal-950/10",
            borderColor: "border-teal-100/50 dark:border-teal-900/20",
            textColor: "text-teal-600 dark:text-teal-400",
        },
        {
            key: "sold",
            label: "Sold",
            bgColor: "bg-blue-50/50 dark:bg-blue-950/10",
            borderColor: "border-blue-100/50 dark:border-blue-900/20",
            textColor: "text-blue-600 dark:text-blue-400",
        },
    ];

    return (
        <div className="min-h-screen text-slate-800 dark:text-slate-200">
            <div className="max-w-full mx-auto px-4 pb-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h1 className="text-2xl font-bold text-primary-600">
                                Dashboard
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Stock and payment overview
                            </p>
                        </div>
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850 transition-all"
                        >
                            <RefreshCwIcon className="w-4 h-4 text-primary-500" />
                            Refresh
                        </button>
                    </div>

                    {/* Stock overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-indigo-500 rounded-xl">
                                    <PackageIcon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                Total Stock
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {data.totalStock}
                            </p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-emerald-500 rounded-xl">
                                    <CarIcon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Available Cars
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {data.availableCars}
                            </p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-blue-500 rounded-xl">
                                    <BdtIcon className="text-white text-base" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Stock Value
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                ৳{Number(data.totalStockValue).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-gray-700">
                            <div className="p-2 bg-indigo-500 text-white rounded-lg">
                                <CarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Car Status Breakdown
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                    Total cars in system: {totalCarsSystem}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {statusCards.map((cfg) => (
                                <div
                                    key={cfg.key}
                                    onClick={() => handleStatusCardClick(cfg.key)}
                                    className={`p-4 ${cfg.bgColor} rounded-xl border ${cfg.borderColor} flex flex-col cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-md`}
                                >
                                    <span
                                        className={`text-xs font-semibold ${cfg.textColor}`}
                                    >
                                        {cfg.label}
                                    </span>
                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                        {carStatusCounts[cfg.key] ?? 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 sm:p-6">
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                            <CreditCardIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Payment Summary
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                Based on filtered payment records
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-200 dark:border-gray-700">
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                Total Sales
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                ৳
                                {totalPaymentPurchaseAmount.toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </p>
                        </div>
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Total Paid ({paidPercentage}%)
                            </p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                ৳
                                {totalPaidAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Total Due
                            </p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                                ৳
                                {totalDueAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment details list */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 flex flex-col min-h-[440px]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 flex-shrink-0 pb-4 border-b border-slate-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                <CreditCardIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Sales & Payment Details
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                    {filteredPayments.length} record
                                    {filteredPayments.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search showroom/customer..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-[200px] sm:w-[240px] bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-250 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
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

                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-750 rounded-xl px-3 py-2">
                                <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                        From
                                    </span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                    />
                                </div>
                                <span className="text-gray-300 font-light mx-0.5">
                                    |
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                        To
                                    </span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="bg-transparent border-0 p-0 text-[11px] font-semibold text-gray-700 dark:text-gray-250 focus:ring-0 focus:outline-none cursor-pointer w-[90px]"
                                    />
                                </div>
                                {(fromDate || toDate) && (
                                    <button
                                        onClick={() => {
                                            setFromDate("");
                                            setToDate("");
                                        }}
                                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md text-slate-400"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() =>
                                    navigate("/admin/payment-history")
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                                View all
                                <ArrowUpRightIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 max-h-[400px]">
                        {filteredPayments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sm text-slate-500 dark:text-gray-400">
                                    No matching payment records found.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPayments.map((payment) => {
                                    const installments =
                                        payment.installments || [];
                                    const totalPaid = installments.reduce(
                                        (sum, inst) =>
                                            sum +
                                            (Number(inst.amount) || 0),
                                        0
                                    );
                                    const remainingBalance =
                                        (Number(payment.purchase_amount) ||
                                            0) - totalPaid;

                                    return (
                                        <div
                                            key={payment.id}
                                            className="p-5 bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-slate-200 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4 cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/payment-history/view/${payment.id}`
                                                )
                                            }
                                        >
                                            <div className="flex justify-between items-start pb-2.5 border-b border-slate-200/60 dark:border-gray-850">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white text-base">
                                                        {payment.showroom_name ||
                                                            payment.customer_name ||
                                                            "Direct Customer"}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-500 mt-0.5">
                                                        Showroom / Client
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-semibold bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-770">
                                                    {payment.purchase_date ||
                                                        "N/A"}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 text-xs text-slate-600 dark:text-gray-400">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">
                                                        Purchase Amount:
                                                    </span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        BDT{" "}
                                                        {(
                                                            Number(
                                                                payment.purchase_amount
                                                            ) || 0
                                                        ).toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 border-t border-slate-200/40 dark:border-gray-800/50 pt-2.5">
                                                    {installments.map(
                                                        (inst, index) => (
                                                            <div
                                                                key={
                                                                    inst.id ||
                                                                    index
                                                                }
                                                                className="flex justify-between items-center"
                                                            >
                                                                <span className="font-medium">
                                                                    {index + 1}
                                                                    {getOrdinalSuffix(
                                                                        index + 1
                                                                    )}{" "}
                                                                    Installment:
                                                                </span>
                                                                <span className="font-semibold text-slate-800 dark:text-gray-200">
                                                                    BDT{" "}
                                                                    {(
                                                                        Number(
                                                                            inst.amount
                                                                        ) || 0
                                                                    ).toLocaleString(
                                                                        undefined,
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                    {installments.length ===
                                                        0 && (
                                                        <p className="text-slate-400 italic">
                                                            No installments
                                                            recorded
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center font-bold border-t border-slate-200 dark:border-gray-800 pt-2.5">
                                                    <span>Remaining Balance:</span>
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        BDT{" "}
                                                        {remainingBalance.toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
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
    );
};
