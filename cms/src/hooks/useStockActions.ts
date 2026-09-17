import { useState, useCallback } from "react";
import { Stock, CreateStockData, UpdateStockData, stockApi } from "../services/stockApi";
import { StockReportService } from "../services/stockReportService";

export const useStockActions = (
    fetchStocks: () => Promise<void>,
    showMessage: (type: "success" | "error", text: string) => void,
    searchTerm: string,
    sortBy: string,
    sortOrder: "asc" | "desc",
    /** Cars with no stock row (Pending tab count); refresh after stock delete/create/update. */
    fetchAvailableCars?: () => Promise<void>
) => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const handleCreateStock = useCallback(() => {
        setSelectedStock(null);
        setDrawerMode("create");
        setShowDrawer(true);
    }, []);

    const handleEditStock = useCallback((stock: Stock) => {
        setSelectedStock(stock);
        setDrawerMode("edit");
        setShowDrawer(true);
    }, []);

    const handleDeleteStock = useCallback((stock: Stock) => {
        setStockToDelete(stock);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!stockToDelete) return;

        setIsDeleting(true);
        try {
            await stockApi.deleteStock(stockToDelete.id);
            setShowDeleteModal(false);
            setStockToDelete(null);
            showMessage("success", "Stock deleted successfully");
            await fetchStocks();
            await fetchAvailableCars?.();
        } catch (error) {
            console.error("Error deleting stock:", error);
            showMessage("error", "Failed to delete stock");
        } finally {
            setIsDeleting(false);
        }
    }, [fetchStocks, fetchAvailableCars, showMessage, stockToDelete]);

    const handleDrawerSubmit = useCallback(
        async (data: CreateStockData | UpdateStockData) => {
            try {
                if (selectedStock && selectedStock.id !== 0) {
                    const response = await stockApi.updateStock(
                        selectedStock.id,
                        data as UpdateStockData
                    );
                    if (response.success) {
                        showMessage("success", "Stock updated successfully");
                        setShowDrawer(false);
                        setSelectedStock(null);
                        await fetchStocks();
                        await fetchAvailableCars?.();
                    } else {
                        showMessage("error", response.message || "Failed to update stock");
                    }
                } else {
                    const response = await stockApi.createStock(data as CreateStockData);
                    if (response.success) {
                        showMessage("success", "Stock created successfully");
                        setShowDrawer(false);
                        setSelectedStock(null);
                        await fetchStocks();
                        await fetchAvailableCars?.();
                    } else {
                        showMessage("error", response.message || "Failed to create stock");
                    }
                }
            } catch (error: any) {
                console.error("Error saving stock:", error);
                const errorMessage =
                    error?.message ||
                    (selectedStock && selectedStock.id !== 0 ? "Failed to update stock" : "Failed to create stock");
                showMessage("error", errorMessage);
            }
        },
        [fetchStocks, fetchAvailableCars, selectedStock, showMessage]
    );

    const handleDrawerClose = useCallback(() => {
        setShowDrawer(false);
        setSelectedStock(null);
    }, []);

    const generatePDF = useCallback(async () => {
        if (isGeneratingPDF) return;

        try {
            setIsGeneratingPDF(true);
            const response = await stockApi.getStocks({
                search: searchTerm || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: 10000,
                page: 1,
            });

            let allPdfStocks: Stock[] = [];

            if (response.success && response.data) {
                allPdfStocks = response.data;
                const totalPages = response.last_page || 1;
                if (totalPages > 1) {
                    const additionalPages = [];
                    for (let page = 2; page <= totalPages; page++) {
                        additionalPages.push(
                            stockApi.getStocks({
                                search: searchTerm || undefined,
                                sort_by: sortBy,
                                sort_order: sortOrder,
                                per_page: 10000,
                                page,
                            })
                        );
                    }
                    const additionalResponses = await Promise.all(additionalPages);
                    additionalResponses.forEach((resp) => {
                        if (resp.success && resp.data) {
                            allPdfStocks = [...allPdfStocks, ...resp.data];
                        }
                    });
                }
            } else {
                alert("Failed to fetch stock data. Please try again.");
                setIsGeneratingPDF(false);
                return;
            }

            await StockReportService.generatePDF(allPdfStocks, searchTerm);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    }, [isGeneratingPDF, searchTerm, sortBy, sortOrder]);

    const handleCreateInvoice = useCallback(
        async (items: any[]) => {
            try {
                const { StockInvoiceService } = await import(
                    "../services/stockInvoiceService"
                );
                const stockInvoiceItems = items.map((item) => ({
                    car: {
                        id: item.car.id.toString(),
                        make: item.car.make,
                        model: item.car.model,
                        year: item.car.year,
                        price:
                            item.price ||
                            (typeof item.car.price_amount === "string"
                                ? parseFloat(item.car.price_amount)
                                : item.car.price_amount || 0),
                        image_url: item.car.photos?.[0]?.url,
                        mileage_km: item.car.mileage_km,
                    },
                    quantity: item.quantity,
                    price: item.price,
                }));
                StockInvoiceService.generateStockInvoice(stockInvoiceItems);
                setShowInvoiceModal(false);
                showMessage("success", "Invoice created successfully");
            } catch (error) {
                console.error("Error creating invoice:", error);
                showMessage("error", "Failed to create invoice");
            }
        },
        [showMessage]
    );

    return {
        isGeneratingPDF,
        showDrawer,
        setShowDrawer,
        drawerMode,
        selectedStock,
        showDeleteModal,
        setShowDeleteModal,
        stockToDelete,
        isDeleting,
        showInvoiceModal,
        setShowInvoiceModal,
        handleCreateStock,
        handleEditStock,
        handleDeleteStock,
        confirmDelete,
        handleDrawerSubmit,
        handleDrawerClose,
        generatePDF,
        handleCreateInvoice,
        setDrawerMode,
        setSelectedStock,
    };
};
