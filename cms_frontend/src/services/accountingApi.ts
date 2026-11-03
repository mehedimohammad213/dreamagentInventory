import { apiClient } from "./apiClient";

export const accountingApi = {
  async summary(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/summary", { params });
    return response.data;
  },

  async costPerCar(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/cost-per-car", { params });
    return response.data;
  },

  async collectionPerCar(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/collection-per-car", {
      params,
    });
    return response.data;
  },

  async carProfit(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/car-profit", { params });
    return response.data;
  },

  async customerLedger(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/customer-ledger", {
      params,
    });
    return response.data;
  },

  async inventoryValuation() {
    const response = await apiClient.get("/accounting/inventory-valuation");
    return response.data;
  },

  async cashBook(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/accounting/cash-book", { params });
    return response.data;
  },

  async receivableAging(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/receivable-aging", {
      params,
    });
    return response.data;
  },

  async setLcAllocations(
    purchaseHistoryId: number,
    body: {
      mode?: "equal_split" | "manual";
      allocations?: Array<{ car_id: number; allocated_cost: number }>;
    }
  ) {
    const response = await apiClient.put(
      `/accounting/lc-allocations/${purchaseHistoryId}`,
      body
    );
    return response.data;
  },

  async listPeriods() {
    const response = await apiClient.get("/accounting/periods");
    return response.data;
  },

  async lockPeriod(year_month: string, notes?: string) {
    const response = await apiClient.post("/accounting/periods/lock", {
      year_month,
      notes,
    });
    return response.data;
  },

  async unlockPeriod(yearMonth: string, notes?: string) {
    const response = await apiClient.post(
      `/accounting/periods/${yearMonth}/unlock`,
      { notes }
    );
    return response.data;
  },

  async auditLogs(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get("/accounting/audit-logs", { params });
    return response.data;
  },

  async exportExcel(params?: Record<string, string | undefined>) {
    const response = await apiClient.get("/accounting/export", {
      params,
      responseType: "blob",
    });
    return response;
  },
};

export default accountingApi;
