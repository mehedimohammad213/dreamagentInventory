import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "react-toastify";
import PurchaseHistoryModal from "../../components/purchase-history/PurchaseHistoryModal";
import {
  purchaseHistoryApi,
  PurchaseHistory,
  CreatePurchaseHistoryData,
  UpdatePurchaseHistoryData,
} from "../../services/purchaseHistoryApi";
import {
  purchaseHistoryPath,
  type PurchasePageTab,
} from "../../utils/purchaseNavigation";

type LocationState = {
  records?: PurchaseHistory[];
  /** First row of an LC group — used to prefill LC fields on create */
  lcTemplate?: PurchaseHistory;
  /** Tab to restore on `/admin/purchase-history` (from list / view). */
  returnPurchaseTab?: PurchasePageTab;
};

const PurchaseHistoryEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const isCreate = !id;
  const isBulkEdit = id === "bulk";

  const mode: "create" | "update" = isCreate ? "create" : "update";

  const lcTemplateForCreate =
    isCreate
      ? (location.state as LocationState | null)?.lcTemplate ?? null
      : null;

  const [purchaseHistory, setPurchaseHistory] = useState<
    PurchaseHistory | PurchaseHistory[] | null
  >(null);
  const [loading, setLoading] = useState(!isCreate);

  const returnPurchaseTab = (location.state as LocationState | null)
    ?.returnPurchaseTab;

  const goBack = useCallback(() => {
    navigate(purchaseHistoryPath(returnPurchaseTab));
  }, [navigate, returnPurchaseTab]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isCreate) {
        setPurchaseHistory(null);
        setLoading(false);
        return;
      }

      if (isBulkEdit) {
        const records = (location.state as LocationState | null)?.records;
        if (!records?.length) {
          toast.error("No records to edit. Open bulk edit from LC view.");
          navigate(purchaseHistoryPath(returnPurchaseTab), { replace: true });
          return;
        }
        setPurchaseHistory(records);
        setLoading(false);
        return;
      }

      const numId = parseInt(id!, 10);
      if (Number.isNaN(numId)) {
        toast.error("Invalid purchase id");
        navigate(purchaseHistoryPath(returnPurchaseTab), { replace: true });
        return;
      }

      setLoading(true);
      try {
        const response = await purchaseHistoryApi.getPurchaseHistory(numId);
        if (cancelled) return;
        if (response.success && response.data) {
          setPurchaseHistory(response.data);
        } else {
          toast.error(response.message || "Purchase history not found");
          navigate(purchaseHistoryPath(returnPurchaseTab), { replace: true });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Failed to load purchase history");
          navigate(purchaseHistoryPath(returnPurchaseTab), { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isBulkEdit, isCreate, navigate, location.state, returnPurchaseTab]);

  const handleSubmit = async (
    data: CreatePurchaseHistoryData | UpdatePurchaseHistoryData | CreatePurchaseHistoryData[]
  ) => {
    try {
      if (Array.isArray(data)) {
        let successCount = 0;
        let failCount = 0;

        for (const item of data) {
          const itemWithId = item as CreatePurchaseHistoryData & { id?: number };
          let response;

          if (mode === "update" && itemWithId.id) {
            response = await purchaseHistoryApi.updatePurchaseHistory(
              itemWithId.id,
              item
            );
          } else {
            response = await purchaseHistoryApi.createPurchaseHistory(item);
          }

          if (response.success) {
            successCount++;
          } else {
            failCount++;
            console.error(
              `Failed to ${itemWithId.id ? "update" : "create"} purchase history:`,
              response.message
            );
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} records processed successfully`);
          navigate(purchaseHistoryPath(returnPurchaseTab));
        }
        if (failCount > 0) {
          toast.error(`${failCount} records failed`);
        }
        return;
      }

      if (mode === "update" && purchaseHistory) {
        const historyToUpdate = Array.isArray(purchaseHistory)
          ? purchaseHistory[0]
          : purchaseHistory;
        const response = await purchaseHistoryApi.updatePurchaseHistory(
          historyToUpdate.id,
          data as UpdatePurchaseHistoryData
        );
        if (response.success) {
          toast.success("Purchase history updated successfully");
          navigate(purchaseHistoryPath(returnPurchaseTab));
        } else {
          toast.error(response.message || "Failed to update purchase history");
        }
      } else {
        const response = await purchaseHistoryApi.createPurchaseHistory(
          data as CreatePurchaseHistoryData
        );
        if (response.success) {
          toast.success("Purchase history created successfully");
          navigate(purchaseHistoryPath(returnPurchaseTab));
        } else {
          toast.error(response.message || "Failed to create purchase history");
        }
      }
    } catch (error) {
      console.error("Error saving purchase history:", error);
      toast.error("Failed to save purchase history");
    }
  };

  const { pageTitle, pageSubtitle } = useMemo(() => {
    if (isCreate) {
      const lcLabel = lcTemplateForCreate?.lc_number?.trim();
      return {
        pageTitle: lcLabel
          ? `Add purchase under LC ${lcLabel}`
          : "Add Purchase History",
        pageSubtitle: lcLabel
          ? "LC bank and date are prefilled; add the car and costs below"
          : "Record LC details, costs, and documents for new inventory",
      };
    }
    if (isBulkEdit && Array.isArray(purchaseHistory)) {
      return {
        pageTitle: "Edit LC group",
        pageSubtitle: `Update ${purchaseHistory.length} cars sharing the same letter of credit`,
      };
    }
    if (purchaseHistory && !Array.isArray(purchaseHistory)) {
      return {
        pageTitle: `Edit Purchase #${purchaseHistory.id}`,
        pageSubtitle:
          "Update LC, financial, and document information",
      };
    }
    return {
      pageTitle: "Edit Purchase History",
      pageSubtitle: "Update purchase records",
    };
  }, [isCreate, isBulkEdit, purchaseHistory, lcTemplateForCreate?.lc_number]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pt-6">
        <div className="mb-4 px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-2 shrink-0 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="font-medium">Back</span>
              </button>
              <div className="min-w-0 sm:border-l sm:border-gray-200 sm:dark:border-gray-600 sm:pl-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {pageSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <PurchaseHistoryModal
          variant="page"
          isOpen
          mode={mode}
          purchaseHistory={purchaseHistory}
          lcPrefillForCreate={lcTemplateForCreate}
          onClose={goBack}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default PurchaseHistoryEditorPage;
