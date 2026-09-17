import { useState, useEffect } from "react";
import { orderApi } from "../services/orderApi";

export const usePendingOrders = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPendingOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getAllOrders();
      if (response.success && response.data?.orders) {
        const pendingOrders = response.data.orders.filter(
          (order: any) => order.status === "pending"
        );
        setPendingCount(pendingOrders.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();

    // Refresh pending orders count every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    isLoading,
    refetch: fetchPendingOrders,
  };
};
