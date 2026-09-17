"use client";

import { useCallback, useEffect, useState } from "react";
import { stockApi, Stock } from "../services/stockApi";
import { useStockFilters, StockListScope } from "./useStockFilters";
import { useStockActions } from "./useStockActions";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export const useStockManagement = (stockScope: StockListScope = "all") => {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailableCars, setIsLoadingAvailableCars] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      setIsLoading(true);
      const baseParams = {
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
        per_page: 10000,
        page: 1,
      };

      const response = await stockApi.getStocks(baseParams);

      let merged: Stock[] = [];
      if (response.success && response.data) {
        merged = response.data;
        const totalPages = response.last_page ?? 1;
        if (totalPages > 1) {
          const pageRequests = [];
          for (let page = 2; page <= totalPages; page++) {
            pageRequests.push(
              stockApi.getStocks({ ...baseParams, page })
            );
          }
          const more = await Promise.all(pageRequests);
          more.forEach((r) => {
            if (r.success && r.data?.length) {
              merged = [...merged, ...r.data];
            }
          });
        }
        setAllStocks(merged);
      } else {
        setAllStocks([]);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      showMessage("error", "Failed to fetch stocks");
      setAllStocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  const fetchAvailableCars = useCallback(async () => {
    try {
      setIsLoadingAvailableCars(true);
      const response = await stockApi.getAvailableCars();
      if (response.success && response.data) {
        setAvailableCars(response.data);
      } else {
        setAvailableCars([]);
      }
    } catch (error) {
      console.error("Error fetching available cars:", error);
      setAvailableCars([]);
    } finally {
      setIsLoadingAvailableCars(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const stockFilters = useStockFilters(allStocks, stockScope);
  const stockActions = useStockActions(
    fetchStocks,
    showMessage,
    stockFilters.searchTerm,
    stockFilters.sortBy,
    stockFilters.sortOrder,
    fetchAvailableCars
  );

  return {
    ...stockFilters,
    ...stockActions,
    allStocks,
    availableCars,
    isLoading,
    isLoadingAvailableCars,
    message,
    fetchStocks,
    fetchAvailableCars,
    showMessage,
  };
};
