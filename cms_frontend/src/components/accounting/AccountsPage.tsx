"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Landmark,
  Plus,
  RefreshCw,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  bankAccountApi,
  BankAccount,
  CreateBankAccountData,
  BankTransaction,
} from "@/services/bankAccountApi";

function formatMoney(value?: number | null) {
  const n = Number(value || 0);
  return `৳${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const emptyForm: CreateBankAccountData = {
  name: "",
  bank_name: "",
  branch_name: "",
  account_number: "",
  account_type: "bank",
  currency: "BDT",
  opening_balance: 0,
  opening_balance_date: new Date().toISOString().slice(0, 10),
  is_active: true,
  notes: "",
};

const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user?.role === "admin";
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<CreateBankAccountData>(emptyForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    txn_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedId) || null,
    [accounts, selectedId]
  );

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bankAccountApi.list();
      const list: BankAccount[] = res.data || [];
      setAccounts(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
      if (selectedId && !list.some((a) => a.id === selectedId)) {
        setSelectedId(list[0]?.id ?? null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const fetchTransactions = useCallback(async (accountId: number) => {
    try {
      const res = await bankAccountApi.listTransactions({
        bank_account_id: accountId,
        per_page: 50,
      });
      setTransactions(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load transactions");
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedId) fetchTransactions(selectedId);
  }, [selectedId, fetchTransactions]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditing(account);
    setForm({
      name: account.name,
      bank_name: account.bank_name || "",
      branch_name: account.branch_name || "",
      account_number: account.account_number || "",
      account_type: account.account_type,
      currency: account.currency || "BDT",
      opening_balance: account.opening_balance || 0,
      opening_balance_date: account.opening_balance_date
        ? String(account.opening_balance_date).slice(0, 10)
        : "",
      is_active: account.is_active,
      notes: account.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await bankAccountApi.update(editing.id, form);
        if (!res.success) throw new Error(res.message || "Update failed");
        toast.success("Account updated");
      } else {
        const res = await bankAccountApi.create(form);
        if (!res.success) throw new Error(res.message || "Create failed");
        toast.success("Account created");
      }
      setModalOpen(false);
      await fetchAccounts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Save failed");
    }
  };

  const handleDelete = async (account: BankAccount) => {
    if (!confirm(`Delete account "${account.name}"?`)) return;
    try {
      const res = await bankAccountApi.remove(account.id);
      if (!res.success) throw new Error(res.message || "Delete failed");
      toast.success("Account deleted");
      await fetchAccounts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Delete failed");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await bankAccountApi.transfer({
        from_account_id: Number(transferForm.from_account_id),
        to_account_id: Number(transferForm.to_account_id),
        amount: Number(transferForm.amount),
        txn_date: transferForm.txn_date,
        notes: transferForm.notes || null,
      });
      if (!res.success) throw new Error(res.message || "Transfer failed");
      toast.success("Transfer completed");
      setTransferOpen(false);
      await fetchAccounts();
      if (selectedId) await fetchTransactions(selectedId);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error.message || "Transfer failed"
      );
    }
  };

  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.current_balance || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary-600" />
            Bank & Cash Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total balance: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatMoney(totalBalance)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchAccounts()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => setTransferOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <ArrowLeftRight className="h-4 w-4" /> Transfer
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" /> Add Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700">
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              No accounts yet. Create Cash/Bank to start.
            </div>
          ) : (
            accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedId(account.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedId === account.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                    : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                      {account.account_type}
                      {!account.is_active ? " · inactive" : ""}
                    </div>
                    {account.account_number ? (
                      <div className="mt-1 text-xs text-gray-500">
                        A/C {account.account_number}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatMoney(account.current_balance)}
                    </div>
                    {canWrite && (
                      <div className="mt-2 flex justify-end gap-1">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(account);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-white hover:text-primary-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(account);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-white hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {selectedAccount ? `${selectedAccount.name} statement` : "Statement"}
            </h2>
          </div>
          {!selectedAccount ? (
            <p className="text-sm text-gray-500">Select an account</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Reference</th>
                    <th className="py-2 pr-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-3">
                        {String(txn.txn_date).slice(0, 10)}
                      </td>
                      <td className="py-2 pr-3 capitalize">{txn.type}</td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                        {txn.reference || txn.notes || "—"}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right font-medium ${
                          txn.type === "in"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {txn.type === "in" ? "+" : "-"}
                        {formatMoney(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit Account" : "Add Account"}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Type</label>
                <select
                  value={form.account_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      account_type: e.target.value as "bank" | "cash",
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Opening balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.opening_balance ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      opening_balance: e.target.value
                        ? Number(e.target.value)
                        : 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Bank name</label>
                <input
                  value={form.bank_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Branch</label>
                <input
                  value={form.branch_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, branch_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Account number</label>
                <input
                  value={form.account_number || ""}
                  onChange={(e) =>
                    setForm({ ...form, account_number: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {transferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleTransfer}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <h3 className="text-lg font-semibold">Transfer</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm">From</label>
                <select
                  required
                  value={transferForm.from_account_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      from_account_id: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">To</label>
                <select
                  required
                  value={transferForm.to_account_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      to_account_id: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Amount</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Date</label>
                <input
                  type="date"
                  value={transferForm.txn_date}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      txn_date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
