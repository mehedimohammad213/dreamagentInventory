import React, { useState, useMemo } from "react";
import { PurchaseHistory } from "../../services/purchaseHistoryApi";
import {
    FileText,
    Car,
    ChevronDown,
    ChevronUp,
    Calendar,
    Database,
    Building2,
    ArrowRight,
    Info,
    Edit2,
    Trash2,
    Plus,
    Download,
} from "lucide-react";
import jsPDF from "jspdf";
import StockActionsDropdown from "../stock/StockActionsDropdown";

/** Encode TTF binary for jsPDF addFileToVFS (chunked to avoid call-stack limits). */
function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
}

let cachedNotoBengaliBase64: string | null | undefined;

/** Loads Noto Sans Bengali once; needed so ৳ renders in PDF (Helvetica has no glyph). */
async function fetchNotoSansBengaliBase64(): Promise<string | null> {
    if (cachedNotoBengaliBase64 !== undefined) return cachedNotoBengaliBase64;
    try {
        const url = `${import.meta.env.BASE_URL}fonts/NotoSansBengali-Regular.ttf`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Font HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        cachedNotoBengaliBase64 = uint8ArrayToBase64(new Uint8Array(buf));
        return cachedNotoBengaliBase64;
    } catch {
        cachedNotoBengaliBase64 = null;
        return null;
    }
}

interface PurchaseHistoryLCViewProps {
    purchaseHistories: PurchaseHistory[];
    isLoading: boolean;
    onView?: (purchaseHistory: PurchaseHistory) => void;
    onEdit?: (purchaseHistory: PurchaseHistory | PurchaseHistory[]) => void;
    onDelete?: (purchaseHistory: PurchaseHistory) => void;
    /** Navigate to create purchase history with LC fields copied from this group */
    onAddUnderLc?: (template: PurchaseHistory) => void;
}

/** Aligns with PurchaseHistoryDetails summary “Total” (purchase + duty + CNF + misc). */
const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = parseFloat(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
};

const getPurchaseSummaryTotal = (ph: PurchaseHistory): number | null => {
    const purchaseAmountValue = toNumber(ph.purchase_amount);
    const govtDutyValue = toNumber(ph.govt_duty);
    const cnfAmountValue = toNumber(ph.cnf_amount);
    const miscellaneousValue = toNumber(ph.miscellaneous);

    const hasCostValues = [
        purchaseAmountValue,
        toNumber(ph.foreign_amount),
        toNumber(ph.bdt_amount),
        govtDutyValue,
        cnfAmountValue,
        miscellaneousValue,
    ].some((v) => v !== null);

    if (!hasCostValues) return null;

    return (
        (purchaseAmountValue || 0) +
        (govtDutyValue || 0) +
        (cnfAmountValue || 0) +
        (miscellaneousValue || 0)
    );
};

const formatBdt = (amount: number | null): string => {
    if (amount === null) return "N/A";
    const nf = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `৳${nf.format(amount)}`;
};

const PurchaseHistoryLCView: React.FC<PurchaseHistoryLCViewProps> = ({
    purchaseHistories,
    isLoading,
    onView,
    onEdit,
    onDelete,
    onAddUnderLc,
}) => {
    const [expandedLC, setExpandedLC] = useState<string | null>(null);
    const [downloadingLc, setDownloadingLc] = useState<string | null>(null);

    const groupedByLC = useMemo(() => {
        const groups: Record<string, PurchaseHistory[]> = {};
        purchaseHistories.forEach((ph) => {
            const lc = ph.lc_number || "No LC Number";
            if (!groups[lc]) {
                groups[lc] = [];
            }
            groups[lc].push(ph);
        });
        return groups;
    }, [purchaseHistories]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                        <div className="flex justify-between items-center">
                            <div className="space-y-3 w-1/3">
                                <div className="h-6 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-10 bg-gray-200 rounded-full w-24"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (Object.keys(groupedByLC).length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                <Database className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No LC Records Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
        );
    }

    const downloadLcPdf = async (lcNumber: string, histories: PurchaseHistory[]) => {
        if (!histories?.length) return;
        setDownloadingLc(lcNumber);

        try {
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const notoB64 = await fetchNotoSansBengaliBase64();
            const useNotoForBdt = Boolean(notoB64);
            if (notoB64) {
                doc.addFileToVFS("NotoSansBengali-Regular.ttf", notoB64);
                doc.addFont("NotoSansBengali-Regular.ttf", "NotoSansBengali", "normal");
            }

            const marginX = 14;
            const xSep = 92; // dotted divider x like the screenshot
            const xLeft = marginX;
            const xCarVal = xLeft + 6;
            // Keep chassis values aligned with the "Chassis No." title
            const xChassisVal = xSep - 30;
            const xRightLabel = xSep + 18;
            const xRightValue = pageWidth - marginX;

            const nf2 = new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            const formatYen = (n: number | null): string => {
                if (n === null) return "N/A";
                return `¥${nf2.format(n)}`;
            };
            const formatUsd = (n: number | null): string => {
                if (n === null) return "N/A";
                return `$${nf2.format(n)}`;
            };
            const formatBdtPdf = (n: number | null): string => {
                if (n === null) return "N/A";
                const num = nf2.format(n);
                if (useNotoForBdt) return `৳${num}`;
                return `Tk ${num}`;
            };
            const drawBdtValue = (n: number | null, x: number, y: number) => {
                const text = formatBdtPdf(n);
                if (text === "N/A") {
                    doc.setFont("helvetica", "normal");
                    doc.text(text, x, y, { align: "right" });
                    return;
                }
                if (useNotoForBdt) {
                    doc.setFont("NotoSansBengali", "normal");
                    doc.text(text, x, y, { align: "right" });
                } else {
                    doc.setFont("helvetica", "normal");
                    doc.text(text, x, y, { align: "right" });
                }
                doc.setFont("helvetica", "normal");
            };
            const formatRate = (n: number | null): string => {
                if (n === null) return "N/A";
                return nf2.format(n);
            };

            const setDotted = () => {
                const maybeFn = (doc as unknown as { setLineDash?: (pattern: number[]) => void })
                    .setLineDash;
                if (typeof maybeFn === "function") {
                    maybeFn.call(doc, [2, 2]);
                }
            };
            const resetDotted = () => {
                const maybeFn = (doc as unknown as { setLineDash?: (pattern: number[]) => void })
                    .setLineDash;
                if (typeof maybeFn === "function") {
                    maybeFn.call(doc, []);
                }
            };

            const drawHeader = () => {
                const titleY = 14;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.setTextColor(0, 0, 0);
                doc.text("DREAM AGENT CAR VISION", pageWidth / 2, titleY, {
                    align: "center",
                });

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(
                    "57,Purana Palton Line, VIP Road ,Dhaka-1000.",
                    pageWidth / 2,
                    titleY + 6,
                    { align: "center" }
                );

                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                const lcReportY = titleY + 22;
                const text = "L/C Report";
                doc.text(text, pageWidth / 2, lcReportY, { align: "center" });

                const tw = doc.getTextWidth(text);
                doc.setLineWidth(0.3);
                doc.line(
                    pageWidth / 2 - tw / 2,
                    lcReportY + 2,
                    pageWidth / 2 + tw / 2,
                    lcReportY + 2
                );
            };

            const first = histories[0];
            const lcDate = first.lc_date
                ? new Date(first.lc_date).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })
                : "N/A";

            const totalCars = histories.reduce(
                (acc, curr) => acc + (curr.cars?.length || (curr.car ? 1 : 0)),
                0
            );
            const totalUnit = first.total_units_per_lc || String(totalCars);

            const drawInfoRow = () => {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                const y = 48;
                doc.text(`L/C Number: ${lcNumber}`, xLeft, y);
                doc.text(`L/C Date: ${lcDate}`, pageWidth / 2, y, { align: "center" });
                doc.text(`Total Unit: ${totalUnit}`, xRightValue, y, { align: "right" });
            };

            drawHeader();
            drawInfoRow();

            let y = 60;
            const blockHeight = 62;
            const blockGap = 14; // extra space to prevent text/dash overlaps

            const ensureSpace = () => {
                if (y + blockHeight + blockGap > pageHeight - 10) {
                    doc.addPage();
                    drawHeader();
                    drawInfoRow();
                    y = 60;
                }
            };

            const drawDottedVertical = (topY: number, bottomY: number) => {
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);
                setDotted();
                doc.line(xSep, topY, xSep, bottomY);
                resetDotted();
            };
            const drawDottedHLine = (fromX: number, toX: number, atY: number) => {
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);
                setDotted();
                doc.line(fromX, atY, toX, atY);
                resetDotted();
            };

            histories.forEach((history) => {
                const cars = (history.cars && history.cars.length > 0)
                    ? history.cars
                    : (history.car ? [history.car] : []);

                const safeCars = cars.length > 0 ? cars : [null];

                safeCars.forEach((car) => {
                    ensureSpace();
                    const topY = y;
                    const rightTopY = topY + 8;

                    // Left headings
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9.2);
                    doc.text("Car Name", xLeft + 6, topY + 2);
                    doc.text("Chassis No.", xSep - 30, topY + 2);

                    // Left values
                    const carName = (car?.model || car?.make || "N/A").toString();
                    const year = car?.year ?? "N/A";
                    const color = car?.color ?? "N/A";
                    const chassis = (car?.chassis_no_full || car?.chassis_no_masked || "N/A").toString();

                    doc.setFontSize(10);
                    doc.text(carName, xCarVal, topY + 16);
                    doc.setFontSize(9.2);
                    doc.text(`Year: ${year}`, xCarVal, topY + 21);
                    doc.text(`Color: ${color}`, xCarVal, topY + 26);
                    doc.setFontSize(10);
                    doc.text(chassis, xChassisVal, topY + 16);

                    // Dotted divider through block
                    drawDottedVertical(topY + 5, topY + blockHeight - 7);

                    // Amounts (per history)
                    const bidYen = toNumber(history.bid_price);
                    const serYen = toNumber(history.ser_com);
                    const yenTotal = (bidYen ?? 0) + (serYen ?? 0);

                    const usdAmount = toNumber(history.foreign_amount);
                    const bdtAmount = toNumber(history.bdt_amount);

                    const usdJpyRate =
                        usdAmount && usdAmount > 0 ? yenTotal / usdAmount : null;
                    const usdBdtRate =
                        usdAmount && usdAmount > 0 && bdtAmount !== null
                            ? (bdtAmount ?? 0) / usdAmount
                            : null;

                    const govtDuty = toNumber(history.govt_duty);
                    const cnfAmount = toNumber(history.cnf_amount);
                    const misc = toNumber(history.miscellaneous);

                    const total =
                        getPurchaseSummaryTotal(history) ??
                        ((bdtAmount ?? 0) +
                            (govtDuty ?? 0) +
                            (cnfAmount ?? 0) +
                            (misc ?? 0));

                    // Right panel (YEN -> USD -> BDT)
                    doc.setFontSize(9.2);

                    doc.text("BID PRICE YEN", xRightLabel, rightTopY + 2);
                    doc.text(formatYen(bidYen), xRightValue, rightTopY + 2, { align: "right" });
                    doc.text("SER+COM YEN", xRightLabel, rightTopY + 6);
                    doc.text(formatYen(serYen), xRightValue, rightTopY + 6, { align: "right" });

                    drawDottedHLine(xSep + 2, xRightValue - 2, rightTopY + 14);

                    doc.text(
                        `US DOLLAR (USD/JPY)=${formatRate(usdJpyRate)}`,
                        xRightLabel,
                        rightTopY + 19
                    );
                    doc.text(formatUsd(usdAmount), xRightValue, rightTopY + 19, { align: "right" });

                    doc.text(
                        `BDT (USD*BDT = ${formatRate(usdBdtRate)})`,
                        xRightLabel,
                        rightTopY + 24
                    );
                    drawBdtValue(bdtAmount, xRightValue, rightTopY + 24);

                    drawDottedHLine(xSep + 2, xRightValue - 2, rightTopY + 30);

                    doc.text("GOVT DUTY", xRightLabel, rightTopY + 35);
                    drawBdtValue(govtDuty, xRightValue, rightTopY + 35);
                    doc.text("C&F AMOUNT", xRightLabel, rightTopY + 40);
                    drawBdtValue(cnfAmount, xRightValue, rightTopY + 40);
                    doc.text("MISCELLANEOUS", xRightLabel, rightTopY + 45);
                    drawBdtValue(misc, xRightValue, rightTopY + 45);

                    drawDottedHLine(xSep + 2, xRightValue - 2, rightTopY + 50);
                    doc.setFont("helvetica", "bold");
                    doc.text("TOTAL", xRightLabel, rightTopY + 55);
                    drawBdtValue(total ?? null, xRightValue, rightTopY + 55);
                    doc.setFont("helvetica", "normal");

                    y += blockHeight + blockGap;
                });
            });

            const safeLc = lcNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
            doc.save(`lc-report-${safeLc}.pdf`);
        } catch (err) {
            console.error("LC PDF export failed", err);
        } finally {
            setDownloadingLc(null);
        }
    };

    return (
        <div className="space-y-4">
            {Object.entries(groupedByLC).map(([lcNumber, histories]) => {
                const isExpanded = expandedLC === lcNumber;
                const totalCars = histories.reduce((acc, curr) => acc + (curr.cars?.length || (curr.car ? 1 : 0)), 0);

                return (
                    <div
                        key={lcNumber}
                        className={`group bg-white rounded-2xl shadow-md border-2 transition-all duration-300 overflow-hidden ${isExpanded
                            ? "border-primary-500 shadow-xl ring-4 ring-primary-50"
                            : "border-transparent hover:border-primary-200 hover:shadow-lg"
                            }`}
                    >
                        {/* LC Header Card */}
                        <div
                            className={`p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isExpanded ? "bg-primary-50/50" : "hover:bg-slate-50"
                                }`}
                            onClick={() => setExpandedLC(isExpanded ? null : lcNumber)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl transition-all duration-300 ${isExpanded ? "bg-primary-600 text-white rotate-12 scale-110 shadow-lg" : "bg-primary-50 text-primary-600 group-hover:scale-110"
                                    }`}>
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {lcNumber}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                            <Building2 className="w-4 h-4 text-primary-500" />
                                            {histories[0].lc_bank_name || "N/A Bank"}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                            <Calendar className="w-4 h-4 text-primary-500" />
                                            LC: {histories[0].lc_date ? new Date(histories[0].lc_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                            <Car className="w-4 h-4 text-primary-500" />
                                            {totalCars} Vehicles
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <StockActionsDropdown
                                        items={[
                                            ...(onEdit
                                                ? [
                                                      {
                                                          id: "edit-lc",
                                                          label: "Edit LC information",
                                                          icon: Edit2,
                                                          onClick: () =>
                                                              onEdit(histories),
                                                          variant: "amber" as const,
                                                      },
                                                  ]
                                                : []),
                                            ...(onDelete
                                                ? [
                                                      {
                                                          id: "delete-lc",
                                                          label: "Delete LC",
                                                          icon: Trash2,
                                                          onClick: () =>
                                                              onDelete(
                                                                  histories[0]
                                                              ),
                                                          variant: "danger" as const,
                                                      },
                                                  ]
                                                : []),
                                            {
                                                id: "download-lc-pdf",
                                                label: "Download LC PDF",
                                                icon: Download,
                                                onClick: () =>
                                                    void downloadLcPdf(
                                                        lcNumber,
                                                        histories
                                                    ),
                                                variant: "primary" as const,
                                                hidden:
                                                    downloadingLc === lcNumber,
                                            },
                                        ]}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className={`p-2.5 rounded-xl transition-all duration-500 ${isExpanded ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-500"
                                        }`}
                                    aria-expanded={isExpanded}
                                    title={
                                        isExpanded
                                            ? "Collapse LC"
                                            : "Expand LC"
                                    }
                                >
                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Car List - Expandable Section */}
                        {isExpanded && (
                            <div className="bg-slate-50 border-t border-primary-100 animate-in slide-in-from-top-4 duration-500">
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Car className="w-5 h-5 text-primary-500" />
                                            Vehicles under LC: {lcNumber}
                                        </h4>
                                        <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                                            Found {totalCars} cars
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {histories.map((history) => {
                                            const cars = (history.cars && history.cars.length > 0) ? history.cars : (history.car ? [history.car] : []);
                                            return cars.map((car, idx) => (
                                                <div
                                                    key={`${history.id}-${idx}`}
                                                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all duration-300 group/car relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-1 bg-primary-50 text-primary-600 rounded-bl-xl opacity-0 group-hover/car:opacity-100 transition-opacity">
                                                        <Info className="w-4 h-4" />
                                                    </div>

                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="min-w-0 flex-1">
                                                            <h5 className="font-bold text-gray-900 text-lg group-hover/car:text-primary-600 transition-colors truncate">
                                                                {car.make} {car.model}
                                                            </h5>
                                                            <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                                                                REF: {car.ref_no || "N/A"}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="opacity-0 group-hover/car:opacity-100 transition-opacity shrink-0"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <StockActionsDropdown
                                                                items={[
                                                                    ...(onEdit
                                                                        ? [
                                                                              {
                                                                                  id: `edit-${history.id}-${idx}`,
                                                                                  label: "Edit",
                                                                                  icon: Edit2,
                                                                                  onClick: () =>
                                                                                      onEdit(
                                                                                          history
                                                                                      ),
                                                                                  variant:
                                                                                      "amber" as const,
                                                                              },
                                                                          ]
                                                                        : []),
                                                                    ...(onDelete
                                                                        ? [
                                                                              {
                                                                                  id: `delete-${history.id}-${idx}`,
                                                                                  label: "Delete",
                                                                                  icon: Trash2,
                                                                                  onClick: () =>
                                                                                      onDelete(
                                                                                          history
                                                                                      ),
                                                                                  variant:
                                                                                      "danger" as const,
                                                                              },
                                                                          ]
                                                                        : []),
                                                                ]}
                                                            />
                                                        </div>
                                                        <div className="bg-primary-50 p-2.5 rounded-xl text-primary-500 ml-4 hidden sm:block">
                                                            <Car className="w-5 h-5 shadow-sm" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-6 bg-slate-50 p-3 rounded-xl border border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-gray-400 uppercase">Chassis</span>
                                                            <span className="text-sm font-mono font-bold text-gray-800">
                                                                {car.chassis_no_full || car.chassis_no_masked || "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-gray-400 uppercase">LC Date</span>
                                                            <span className="text-sm font-bold text-gray-700">
                                                                {history.lc_date ? new Date(history.lc_date).toLocaleDateString("en-US", {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                }) : "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs font-bold text-gray-400 uppercase shrink-0">Total</span>
                                                            <span className="text-sm font-bold text-gray-800 tabular-nums text-right break-all">
                                                                {formatBdt(getPurchaseSummaryTotal(history))}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => onView?.(history)}
                                                        className="w-full py-3 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        Full History Details
                                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            ));
                                        })}
                                        {onAddUnderLc && histories[0] && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddUnderLc(histories[0]);
                                                }}
                                                className="min-h-[280px] flex flex-col items-center justify-center gap-4 rounded-2xl p-5 border-2 border-dashed border-primary-300 bg-white/80 shadow-sm hover:shadow-xl hover:border-primary-500 hover:bg-primary-50/60 transition-all duration-300 group/add text-center"
                                                title="Add purchase history under this LC"
                                            >
                                                <div className="p-4 rounded-2xl bg-primary-100 text-primary-600 group-hover/add:bg-primary-600 group-hover/add:text-white transition-colors shadow-sm">
                                                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-gray-900 group-hover/add:text-primary-700">
                                                        Add car
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        New purchase under this LC
                                                    </p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </div>
                );
            })}
        </div >
    );
};

export default PurchaseHistoryLCView;
