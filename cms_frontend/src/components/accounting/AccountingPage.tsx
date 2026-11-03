"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Calculator, Plus, Trash2, RefreshCw, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { accountingApi } from "@/services/accountingApi";
import {
  expenseApi,
  Expense,
  EXPENSE_CATEGORIES,
  CreateExpenseData,
} from "@/services/expenseApi";
import { bankAccountApi, BankAccount } from "@/services/bankAccountApi";
import {
  supplierPaymentApi,
  SupplierPayment,
  SUPPLIER_PAYMENT_CATEGORIES,
  CreateSupplierPaymentData,
} from "@/services/supplierPaymentApi";
import {
  carExtraCostApi,
  CarExtraCost,
  EXTRA_COST_CATEGORIES,
  CreateCarExtraCostData,
} from "@/services/carExtraCostApi";
import { carApi } from "@/services/carApi";

type TabKey =
  | "summary"
  | "cost"
  | "collection"
  | "expenses"
  | "profit"
  | "supplier"
  | "extra"
  | "ledger"
  | "inventory"
  | "cashbook"
  | "aging"
  | "periods"
  | "audit";

function formatMoney(value?: number | null) {
  const n = Number(value || 0);
  return `৳${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "cost", label: "Cost per car" },
  { key: "collection", label: "Collection" },
  { key: "profit", label: "Profit" },
  { key: "expenses", label: "Expenses" },
  { key: "supplier", label: "Supplier pay" },
  { key: "extra", label: "Extra cost" },
  { key: "ledger", label: "Customer ledger" },
  { key: "inventory", label: "Stock value" },
  { key: "cashbook", label: "Cash book" },
  { key: "aging", label: "Due aging" },
  { key: "periods", label: "Period lock" },
  { key: "audit", label: "Audit log" },
];

const AccountingPage: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user?.role === "admin";
  const [tab, setTab] = useState<TabKey>("summary");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [costRows, setCostRows] = useState<any[]>([]);
  const [costTotals, setCostTotals] = useState<any>(null);
  const [collectionRows, setCollectionRows] = useState<any[]>([]);
  const [collectionTotals, setCollectionTotals] = useState<any>(null);
  const [profitRows, setProfitRows] = useState<any[]>([]);
  const [profitTotals, setProfitTotals] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [extraCosts, setExtraCosts] = useState<CarExtraCost[]>([]);
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [ledgerTotals, setLedgerTotals] = useState<any>(null);
  const [inventoryRows, setInventoryRows] = useState<any[]>([]);
  const [inventoryTotals, setInventoryTotals] = useState<any>(null);
  const [cashBook, setCashBook] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [lockMonth, setLockMonth] = useState(new Date().toISOString().slice(0, 7));
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cars, setCars] = useState<any[]>([]);

  const [expenseModal, setExpenseModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  const [extraModal, setExtraModal] = useState(false);

  const [expenseForm, setExpenseForm] = useState<CreateExpenseData>({
    expense_date: new Date().toISOString().slice(0, 10),
    category: "other",
    amount: 0,
    description: "",
    bank_account_id: 0,
    payment_method: "Cash",
  });
  const [supplierForm, setSupplierForm] = useState<CreateSupplierPaymentData>({
    payment_date: new Date().toISOString().slice(0, 10),
    category: "other",
    amount: 0,
    description: "",
    supplier_name: "",
    purchase_history_id: null,
    bank_account_id: 0,
    payment_method: "Bank",
  });
  const [extraForm, setExtraForm] = useState<CreateCarExtraCostData>({
    car_id: 0,
    cost_date: new Date().toISOString().slice(0, 10),
    category: "repair",
    amount: 0,
    description: "",
    bank_account_id: null,
    payment_method: null,
  });

  const filters = {
    from: from || undefined,
    to: to || undefined,
  };

  const defaultAccountId = (list: BankAccount[], prefer: "cash" | "bank" = "cash") => {
    const preferred = list.find((a) => a.account_type === prefer) || list[0];
    return preferred?.id || 0;
  };

  const loadAccounts = useCallback(async () => {
    try {
      const res = await bankAccountApi.list({ is_active: true });
      const list: BankAccount[] = res.data || [];
      setAccounts(list);
      if (list.length) {
        setExpenseForm((prev) =>
          prev.bank_account_id
            ? prev
            : { ...prev, bank_account_id: defaultAccountId(list, "cash") }
        );
        setSupplierForm((prev) =>
          prev.bank_account_id
            ? prev
            : { ...prev, bank_account_id: defaultAccountId(list, "bank") }
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadCars = useCallback(async () => {
    try {
      const res = await carApi.getCars({ per_page: 1000 });
      const list = res.data?.data || res.data?.cars || [];
      setCars(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === "summary") {
        const res = await accountingApi.summary(filters);
        setSummary(res.data);
      } else if (tab === "cost") {
        const res = await accountingApi.costPerCar(filters);
        setCostRows(res.data?.rows || []);
        setCostTotals(res.data?.totals || null);
      } else if (tab === "collection") {
        const res = await accountingApi.collectionPerCar(filters);
        setCollectionRows(res.data?.rows || []);
        setCollectionTotals(res.data?.totals || null);
      } else if (tab === "profit") {
        const res = await accountingApi.carProfit(filters);
        setProfitRows(res.data?.rows || []);
        setProfitTotals(res.data?.totals || null);
      } else if (tab === "expenses") {
        const res = await expenseApi.list({
          from: filters.from,
          to: filters.to,
          per_page: 100,
        });
        setExpenses(res.data?.data || []);
      } else if (tab === "supplier") {
        const res = await supplierPaymentApi.list({
          from: filters.from,
          to: filters.to,
          per_page: 100,
        });
        setSupplierPayments(res.data?.data || []);
      } else if (tab === "extra") {
        const res = await carExtraCostApi.list({
          from: filters.from,
          to: filters.to,
          per_page: 100,
        });
        setExtraCosts(res.data?.data || []);
      } else if (tab === "ledger") {
        const res = await accountingApi.customerLedger(filters);
        setLedgerRows(res.data?.rows || []);
        setLedgerTotals(res.data?.totals || null);
      } else if (tab === "inventory") {
        const res = await accountingApi.inventoryValuation();
        setInventoryRows(res.data?.rows || []);
        setInventoryTotals(res.data?.totals || null);
      } else if (tab === "cashbook") {
        const res = await accountingApi.cashBook(filters);
        setCashBook(res.data);
      } else if (tab === "aging") {
        const res = await accountingApi.receivableAging(filters);
        setAging(res.data);
      } else if (tab === "periods") {
        const res = await accountingApi.listPeriods();
        setPeriods(res.data || []);
      } else if (tab === "audit") {
        const res = await accountingApi.auditLogs({
          from: filters.from,
          to: filters.to,
          per_page: 100,
        });
        setAuditRows(res.data?.data || []);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  }, [tab, from, to]);

  useEffect(() => {
    loadAccounts();
    loadCars();
  }, [loadAccounts, loadCars]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await expenseApi.create({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success("Expense saved");
      setExpenseModal(false);
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await supplierPaymentApi.create({
        ...supplierForm,
        amount: Number(supplierForm.amount),
        purchase_history_id: supplierForm.purchase_history_id || null,
      });
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success("Supplier payment saved");
      setSupplierModal(false);
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const saveExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!extraForm.car_id) {
        toast.error("Select a car");
        return;
      }
      const res = await carExtraCostApi.create({
        ...extraForm,
        amount: Number(extraForm.amount),
        bank_account_id: extraForm.bank_account_id || null,
      });
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success("Extra cost saved");
      setExtraModal(false);
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const equalSplitBatch = async (purchaseHistoryId: number) => {
    if (!canWrite) return;
    try {
      const res = await accountingApi.setLcAllocations(purchaseHistoryId, {
        mode: "equal_split",
      });
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success("LC cost split equally across cars");
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const exportExcel = async () => {
    try {
      const response = await accountingApi.exportExcel(filters);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accounting-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Export failed");
    }
  };

  const lockPeriod = async () => {
    if (!canWrite) return;
    try {
      const res = await accountingApi.lockPeriod(lockMonth);
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success(`Locked ${lockMonth}`);
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const unlockPeriod = async (yearMonth: string) => {
    if (!canWrite) return;
    if (!confirm(`Unlock period ${yearMonth}?`)) return;
    try {
      const res = await accountingApi.unlockPeriod(yearMonth);
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success(`Unlocked ${yearMonth}`);
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  const deleteRow = async (
    kind: "expense" | "supplier" | "extra",
    id: number
  ) => {
    if (!confirm("Delete this record?")) return;
    try {
      const api =
        kind === "expense"
          ? expenseApi
          : kind === "supplier"
            ? supplierPaymentApi
            : carExtraCostApi;
      const res = await api.remove(id);
      if (!res.success) throw new Error(res.message || "Failed");
      toast.success("Deleted");
      await loadTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white">
            <Calculator className="h-6 w-6 text-primary-600" />
            Balance History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Cost, collection, expenses, profit, cash book, and reports
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <button
            type="button"
            onClick={loadTabData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          {canWrite && tab === "expenses" && (
            <button type="button" onClick={() => setExpenseModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm text-white">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          )}
          {canWrite && tab === "supplier" && (
            <button type="button" onClick={() => setSupplierModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm text-white">
              <Plus className="h-4 w-4" /> Pay Supplier
            </button>
          )}
          {canWrite && tab === "extra" && (
            <button type="button" onClick={() => setExtraModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm text-white">
              <Plus className="h-4 w-4" /> Add Extra Cost
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-3 py-2 text-sm ${
              tab === item.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 p-8 text-sm text-gray-500 dark:border-gray-700">
          Loading...
        </div>
      )}

      {!loading && tab === "summary" && summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat title="Total balance" value={formatMoney(summary.total_balance)} />
          <Stat
            title="Collected"
            value={formatMoney(summary.collection?.collected)}
            sub={`Due ${formatMoney(summary.collection?.due)}`}
            tone="emerald"
          />
          <Stat title="Car costs" value={formatMoney(summary.cost?.total_cost)} />
          <Stat
            title="Expenses"
            value={formatMoney(summary.expenses?.total_expenses)}
            sub={`Supplier paid ${formatMoney(summary.supplier_payments?.total)}`}
            tone="rose"
          />
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-medium">Account balances</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(summary.accounts || []).map((a: any) => (
                <div key={a.id} className="rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs uppercase text-gray-500">{a.account_type}</div>
                  <div className="mt-1 font-semibold">{formatMoney(a.current_balance)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Gross profit {formatMoney(summary.profit?.gross_profit)} · Net after expenses{" "}
              {formatMoney(summary.profit?.net_after_expenses)}
            </div>
          </div>
        </div>
      )}

      {!loading && tab === "cost" && (
        <DataTable
          headers={["Chassis", "Car", "LC", "Batch cars", "Purchase share", "Extra", "Total", ""]}
          footer={
            costTotals
              ? `Total purchase ${formatMoney(costTotals.total_purchase_cost)} · Extra ${formatMoney(costTotals.total_extra_cost)} · Combined ${formatMoney(costTotals.total_cost)}`
              : null
          }
        >
          {costRows.map((row) => (
            <tr key={`${row.car_id}-${row.purchase_history_id}`} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{row.chassis_no_full || "—"}</td>
              <td className="px-4 py-3">{row.make} {row.model}</td>
              <td className="px-4 py-3">{row.lc_number || `#${row.purchase_history_id}`}</td>
              <td className="px-4 py-3">{row.cars_in_batch}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.purchase_cost)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.extra_cost)}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatMoney(row.total_cost)}</td>
              <td className="px-4 py-3 text-right">
                {row.cars_in_batch > 1 && (
                  <button
                    type="button"
                    onClick={() => equalSplitBatch(row.purchase_history_id)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Equal split
                  </button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "collection" && (
        <DataTable
          headers={["Chassis", "Customer", "Sale", "Collected", "Due", "Last pay"]}
          footer={
            collectionTotals
              ? `Sale ${formatMoney(collectionTotals.sale_amount)} · Collected ${formatMoney(collectionTotals.collected)} · Due ${formatMoney(collectionTotals.due)}`
              : null
          }
        >
          {collectionRows.map((row) => (
            <tr key={row.payment_history_id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{row.chassis_no_full || "—"}</td>
              <td className="px-4 py-3">{row.customer_name || row.showroom_name || "—"}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.sale_amount)}</td>
              <td className="px-4 py-3 text-right text-emerald-600">{formatMoney(row.collected)}</td>
              <td className="px-4 py-3 text-right text-rose-600">{formatMoney(row.due)}</td>
              <td className="px-4 py-3">{row.last_payment_date ? String(row.last_payment_date).slice(0, 10) : "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "profit" && (
        <DataTable
          headers={["Chassis", "Car", "Purchase", "Extra", "Total cost", "Sale", "Profit"]}
          footer={
            profitTotals
              ? `Cost ${formatMoney(profitTotals.total_cost)} · Sale ${formatMoney(profitTotals.sale_amount)} · Profit ${formatMoney(profitTotals.gross_profit)}`
              : null
          }
        >
          {profitRows.map((row) => (
            <tr key={row.car_id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{row.chassis_no_full || "—"}</td>
              <td className="px-4 py-3">{row.make} {row.model}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.purchase_cost)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.extra_cost)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.total_cost)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.sale_amount)}</td>
              <td className={`px-4 py-3 text-right font-semibold ${Number(row.gross_profit || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {row.gross_profit == null ? "—" : formatMoney(row.gross_profit)}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "expenses" && (
        <DataTable headers={["Date", "Category", "Description", "Paid from", "Amount", ""]}>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{String(expense.expense_date).slice(0, 10)}</td>
              <td className="px-4 py-3 capitalize">{expense.category}</td>
              <td className="px-4 py-3">{expense.description || "—"}</td>
              <td className="px-4 py-3">{expense.bank_account?.name || `#${expense.bank_account_id}`}</td>
              <td className="px-4 py-3 text-right text-rose-600">{formatMoney(expense.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <button type="button" onClick={() => deleteRow("expense", expense.id)} className="rounded p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "supplier" && (
        <DataTable headers={["Date", "Category", "Supplier", "LC/Purchase", "Paid from", "Amount", ""]}>
          {supplierPayments.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{String(row.payment_date).slice(0, 10)}</td>
              <td className="px-4 py-3">{row.category}</td>
              <td className="px-4 py-3">{row.supplier_name || "—"}</td>
              <td className="px-4 py-3">
                {row.purchase_history?.lc_number ||
                  (row.purchase_history_id ? `#${row.purchase_history_id}` : "—")}
              </td>
              <td className="px-4 py-3">{row.bank_account?.name || `#${row.bank_account_id}`}</td>
              <td className="px-4 py-3 text-right text-rose-600">{formatMoney(row.amount)}</td>
              <td className="px-4 py-3 text-right">
                {canWrite && (
                  <button type="button" onClick={() => deleteRow("supplier", row.id)} className="rounded p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "extra" && (
        <DataTable headers={["Date", "Car ID", "Category", "Description", "Paid from", "Amount", ""]}>
          {extraCosts.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{String(row.cost_date).slice(0, 10)}</td>
              <td className="px-4 py-3">#{row.car_id}</td>
              <td className="px-4 py-3 capitalize">{row.category}</td>
              <td className="px-4 py-3">{row.description || "—"}</td>
              <td className="px-4 py-3">{row.bank_account?.name || (row.bank_account_id ? `#${row.bank_account_id}` : "Cost only")}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.amount)}</td>
              <td className="px-4 py-3 text-right">
                {canWrite && (
                  <button type="button" onClick={() => deleteRow("extra", row.id)} className="rounded p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "ledger" && (
        <div className="space-y-4">
          {ledgerTotals && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Customers {ledgerTotals.count} · Sale {formatMoney(ledgerTotals.sale_amount)} · Due{" "}
              {formatMoney(ledgerTotals.due)}
            </div>
          )}
          {ledgerRows.map((row) => (
            <div key={row.customer_key} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{row.customer_name}</div>
                  <div className="text-xs text-gray-500">
                    {row.contact_number || "—"} {row.nid_number ? `· NID ${row.nid_number}` : ""}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>Sale {formatMoney(row.sale_amount)}</div>
                  <div className="text-emerald-600">Paid {formatMoney(row.collected)}</div>
                  <div className="font-semibold text-rose-600">Due {formatMoney(row.due)}</div>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-3">Chassis</th>
                      <th className="py-1 pr-3 text-right">Sale</th>
                      <th className="py-1 pr-3 text-right">Collected</th>
                      <th className="py-1 pr-3 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(row.cars || []).map((car: any) => (
                      <tr key={car.payment_history_id}>
                        <td className="py-1 pr-3">{car.chassis_no_full || "—"}</td>
                        <td className="py-1 pr-3 text-right">{formatMoney(car.sale_amount)}</td>
                        <td className="py-1 pr-3 text-right">{formatMoney(car.collected)}</td>
                        <td className="py-1 pr-3 text-right">{formatMoney(car.due)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {!ledgerRows.length && <EmptyState text="No customer ledger rows" />}
        </div>
      )}

      {!loading && tab === "inventory" && (
        <DataTable
          headers={["Chassis", "Car", "Status", "Purchase", "Extra", "Stock value"]}
          footer={
            inventoryTotals
              ? `${inventoryTotals.count} unsold · Value ${formatMoney(inventoryTotals.total_cost)}`
              : null
          }
        >
          {inventoryRows.map((row) => (
            <tr key={row.car_id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3">{row.chassis_no_full || "—"}</td>
              <td className="px-4 py-3">{row.make} {row.model}</td>
              <td className="px-4 py-3">{row.car_status}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.purchase_cost)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.extra_cost)}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatMoney(row.total_cost)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && tab === "cashbook" && cashBook && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat title="Total in" value={formatMoney(cashBook.totals?.total_in)} tone="emerald" />
            <Stat title="Total out" value={formatMoney(cashBook.totals?.total_out)} tone="rose" />
            <Stat title="Net" value={formatMoney(cashBook.totals?.net)} />
          </div>
          {(cashBook.days || []).map((day: any) => (
            <div key={day.date} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm font-medium">
                <span>{day.date}</span>
                <span>
                  In {formatMoney(day.in)} · Out {formatMoney(day.out)} · Net {formatMoney(day.net)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {(day.entries || []).map((entry: any) => (
                  <div key={entry.id} className="flex justify-between gap-3 border-t border-gray-100 py-1 dark:border-gray-800">
                    <div>
                      <span className="uppercase text-xs text-gray-500">{entry.type}</span>{" "}
                      {entry.account_name} · {entry.reference || entry.source_type || "—"}
                    </div>
                    <div className={entry.type === "in" ? "text-emerald-600" : "text-rose-600"}>
                      {entry.type === "in" ? "+" : "-"}
                      {formatMoney(entry.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!(cashBook.days || []).length && <EmptyState text="No cash book entries in range" />}
        </div>
      )}

      {!loading && tab === "aging" && aging && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["current", "days_31_60", "days_61_plus"] as const).map((key) => (
              <Stat
                key={key}
                title={`${aging.buckets[key].label} days`}
                value={formatMoney(aging.buckets[key].amount)}
                sub={`${aging.buckets[key].count} invoices`}
                tone={key === "days_61_plus" ? "rose" : undefined}
              />
            ))}
          </div>
          <DataTable headers={["Customer", "Chassis", "Due", "Days", "Bucket"]}>
            {(["current", "days_31_60", "days_61_plus"] as const).flatMap((key) =>
              (aging.buckets[key].rows || []).map((row: any) => (
                <tr key={`${key}-${row.payment_history_id}`} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{row.customer_name || row.showroom_name || "—"}</td>
                  <td className="px-4 py-3">{row.chassis_no_full || "—"}</td>
                  <td className="px-4 py-3 text-right text-rose-600">{formatMoney(row.due)}</td>
                  <td className="px-4 py-3">{row.days_overdue}</td>
                  <td className="px-4 py-3">{row.aging_bucket}</td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      )}

      {!loading && tab === "periods" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Month to lock</label>
                <input
                  type="month"
                  value={lockMonth}
                  onChange={(e) => setLockMonth(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <button
                type="button"
                onClick={lockPeriod}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
              >
                Lock period
              </button>
            </div>
          )}
          <DataTable headers={["Period", "Status", "Locked at", ""]}>
            {periods.map((period) => (
              <tr key={period.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium">{period.year_month}</td>
                <td className="px-4 py-3">
                  {period.is_locked ? (
                    <span className="text-rose-600">Locked</span>
                  ) : (
                    <span className="text-emerald-600">Open</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {period.locked_at ? String(period.locked_at).slice(0, 19).replace("T", " ") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {canWrite && period.is_locked && (
                    <button
                      type="button"
                      onClick={() => unlockPeriod(period.year_month)}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Unlock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
          {!periods.length && <EmptyState text="No locked periods yet" />}
        </div>
      )}

      {!loading && tab === "audit" && (
        <DataTable headers={["When", "User", "Action", "Entity", "Summary"]}>
          {auditRows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-3 whitespace-nowrap">
                {row.created_at ? String(row.created_at).slice(0, 19).replace("T", " ") : "—"}
              </td>
              <td className="px-4 py-3">{row.user?.name || row.user?.username || "—"}</td>
              <td className="px-4 py-3">{row.action}</td>
              <td className="px-4 py-3">
                {row.entity_type}
                {row.entity_id != null ? ` #${row.entity_id}` : ""}
              </td>
              <td className="px-4 py-3">{row.summary || "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {expenseModal && canWrite && (
        <Modal title="Add Expense" onClose={() => setExpenseModal(false)} onSubmit={saveExpense}>
          <Field label="Date">
            <input type="date" required value={expenseForm.expense_date || ""} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Category">
            <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className={inputClass}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" step="0.01" required value={expenseForm.amount || ""} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="Paid from">
            <AccountSelect accounts={accounts} value={expenseForm.bank_account_id} onChange={(id, method) => setExpenseForm({ ...expenseForm, bank_account_id: id, payment_method: method })} />
          </Field>
          <Field label="Description">
            <input value={expenseForm.description || ""} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className={inputClass} />
          </Field>
        </Modal>
      )}

      {supplierModal && canWrite && (
        <Modal title="Pay Supplier" onClose={() => setSupplierModal(false)} onSubmit={saveSupplier}>
          <Field label="Date">
            <input type="date" required value={supplierForm.payment_date || ""} onChange={(e) => setSupplierForm({ ...supplierForm, payment_date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Category">
            <select value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} className={inputClass}>
              {SUPPLIER_PAYMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Supplier name">
            <input value={supplierForm.supplier_name || ""} onChange={(e) => setSupplierForm({ ...supplierForm, supplier_name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Purchase history ID (optional)">
            <input type="number" value={supplierForm.purchase_history_id || ""} onChange={(e) => setSupplierForm({ ...supplierForm, purchase_history_id: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          </Field>
          <Field label="Amount">
            <input type="number" step="0.01" required value={supplierForm.amount || ""} onChange={(e) => setSupplierForm({ ...supplierForm, amount: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="Paid from">
            <AccountSelect accounts={accounts} value={supplierForm.bank_account_id} onChange={(id, method) => setSupplierForm({ ...supplierForm, bank_account_id: id, payment_method: method })} />
          </Field>
          <Field label="Description">
            <input value={supplierForm.description || ""} onChange={(e) => setSupplierForm({ ...supplierForm, description: e.target.value })} className={inputClass} />
          </Field>
        </Modal>
      )}

      {extraModal && canWrite && (
        <Modal title="Add Extra Cost" onClose={() => setExtraModal(false)} onSubmit={saveExtra}>
          <Field label="Car">
            <select required value={extraForm.car_id || ""} onChange={(e) => setExtraForm({ ...extraForm, car_id: Number(e.target.value) })} className={inputClass}>
              <option value="">Select car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  #{car.id} {car.make} {car.model} {car.chassis_no_full || ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={extraForm.cost_date || ""} onChange={(e) => setExtraForm({ ...extraForm, cost_date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Category">
            <select value={extraForm.category} onChange={(e) => setExtraForm({ ...extraForm, category: e.target.value })} className={inputClass}>
              {EXTRA_COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" step="0.01" required value={extraForm.amount || ""} onChange={(e) => setExtraForm({ ...extraForm, amount: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="Pay from account (optional)">
            <select
              value={extraForm.bank_account_id || ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const account = accounts.find((a) => a.id === id);
                setExtraForm({
                  ...extraForm,
                  bank_account_id: id,
                  payment_method: account ? (account.account_type === "cash" ? "Cash" : "Bank") : null,
                });
              }}
              className={inputClass}
            >
              <option value="">Cost only (no cash out)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input value={extraForm.description || ""} onChange={(e) => setExtraForm({ ...extraForm, description: e.target.value })} className={inputClass} />
          </Field>
        </Modal>
      )}
    </div>
  );
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800";

function Stat({
  title,
  value,
  sub,
  tone,
}: {
  title: string;
  value: string;
  sub?: string;
  tone?: "emerald" | "rose";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div
        className={`mt-2 text-2xl font-semibold ${
          tone === "emerald"
            ? "text-emerald-600"
            : tone === "rose"
              ? "text-rose-600"
              : ""
        }`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

function DataTable({
  headers,
  children,
  footer,
}: {
  headers: string[];
  children: React.ReactNode;
  footer?: string | null;
}) {
  const rows = React.Children.toArray(children);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!rows.length && <EmptyState text="No data" />}
      {footer ? (
        <div className="border-t border-gray-100 px-4 py-3 text-sm font-medium dark:border-gray-800">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-6 text-sm text-gray-500">{text}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      {children}
    </div>
  );
}

function AccountSelect({
  accounts,
  value,
  onChange,
}: {
  accounts: BankAccount[];
  value?: number;
  onChange: (id: number, method: "Bank" | "Cash") => void;
}) {
  return (
    <select
      required
      value={value || ""}
      onChange={(e) => {
        const id = Number(e.target.value);
        const account = accounts.find((a) => a.id === id);
        onChange(id, account?.account_type === "cash" ? "Cash" : "Bank");
      }}
      className={inputClass}
    >
      <option value="">Select account</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} ({a.account_type})
        </option>
      ))}
    </select>
  );
}

function Modal({
  title,
  children,
  onClose,
  onSubmit,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default AccountingPage;
