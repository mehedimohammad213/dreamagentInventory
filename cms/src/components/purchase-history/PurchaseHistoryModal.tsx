import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  X,
  Upload,
  File as FileIcon,
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  PurchaseHistory,
  CreatePurchaseHistoryData,
  UpdatePurchaseHistoryData,
} from "../../services/purchaseHistoryApi";
import { carApi, Car } from "../../services/carApi";
import { cartApi, CartItem } from "../../services/cartApi";
import { ShoppingCart } from "lucide-react";

function PurchaseFormSection({
  variant,
  children,
}: {
  variant: "modal" | "page";
  children: React.ReactNode;
}) {
  if (variant === "page") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6">{children}</div>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-800/80 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
      {children}
    </div>
  );
}

/** Older rows only had foreign_amount — map it to BID so Amount = BID + SER+COM still works. */
function resolveBidSerFromPh(ph: PurchaseHistory): {
  bid_price: number | null;
  ser_com: number | null;
} {
  let bid_price = ph.bid_price ?? null;
  let ser_com = ph.ser_com ?? null;
  if (
    bid_price == null &&
    ser_com == null &&
    ph.foreign_amount != null
  ) {
    const n =
      typeof ph.foreign_amount === "number"
        ? ph.foreign_amount
        : parseFloat(String(ph.foreign_amount));
    if (!Number.isNaN(n)) bid_price = n;
  }
  return { bid_price, ser_com };
}

function sumBidSer(
  bid: number | null | undefined,
  ser: number | null | undefined
): number | null {
  if (bid == null && ser == null) return null;
  return (Number(bid) || 0) + (Number(ser) || 0);
}

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  mode: "create" | "update";
  purchaseHistory?: PurchaseHistory | PurchaseHistory[] | null;
  onClose: () => void;
  onSubmit: (
    data: CreatePurchaseHistoryData | UpdatePurchaseHistoryData | CreatePurchaseHistoryData[]
  ) => void;
  /** Full-page layout (no overlay); use with dedicated routes */
  variant?: "modal" | "page";
  /** When creating from LC view: copy LC fields from an existing row in that group */
  lcPrefillForCreate?: PurchaseHistory | null;
}

const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({
  isOpen,
  mode,
  purchaseHistory,
  onClose,
  onSubmit,
  variant = "modal",
  lcPrefillForCreate = null,
}) => {
  const effectiveOpen = variant === "page" || isOpen;
  const mainHistory = Array.isArray(purchaseHistory) ? purchaseHistory[0] : purchaseHistory;

  const toInputDate = (value: string | null | undefined): string | null => {
    if (!value) return null;
    // Try to parse and normalize to YYYY-MM-DD for <input type="date">
    // Handles values like 'YYYY-MM-DD', ISO strings, or other parseable formats
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    // Fallback: if already looks like YYYY-MM-DD or starts with that, slice it
    if (typeof value === "string" && value.length >= 10) {
      const maybe = value.slice(0, 10);
      // simple check
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybe)) return maybe;
    }
    return null;
  };

  const [formData, setFormData] = useState<CreatePurchaseHistoryData>({
    car_id: null,
    purchase_date: null,
    purchase_amount: null,
    govt_duty: null,
    cnf_amount: null,
    miscellaneous: null,
    bid_price: null,
    ser_com: null,
    lc_date: null,
    lc_number: null,
    lc_bank_name: null,
    lc_bank_branch_name: null,
    lc_bank_branch_address: null,
    total_units_per_lc: null,
    bill_of_lading: null,
    invoice_number: null,
    export_certificate: null,
    export_certificate_translated: null,
    bill_of_exchange_amount: null,
    custom_duty_copy_3pages: null,
    cheque_copy: null,
    certificate: null,
    custom_one: null,
    custom_two: null,
    custom_three: null,
    hs_code: null,
    price_amount: null,
    price_basis: null,
    fob_value_usd: null,
    freight_usd: null,
    currency_type: "yen",
  });

  const [foreignAmount, setForeignAmount] = useState<string>("");
  const [yenToDollarRate, setYenToDollarRate] = useState<string>("");
  const [dollarToBdtRate, setDollarToBdtRate] = useState<string>("");
  const [intermediateDollar, setIntermediateDollar] = useState<string>("");
  const [currencyType, setCurrencyType] = useState<"dollar" | "yen">("yen");
  const [existingFiles, setExistingFiles] = useState<Record<string, string>>(
    {}
  );
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const [carEntries, setCarEntries] = useState<CreatePurchaseHistoryData[]>([]);
  /** After "Add Car to List", collapse the draft form until user clicks "Add another car". */
  const [draftFormExpanded, setDraftFormExpanded] = useState(true);
  /** Index in carEntries being edited; null = new car draft. */
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  /** Avoid clearing manual Total Units when list was never used (create flow). */
  const hadCarEntriesInCreateRef = useRef(false);

  useEffect(() => {
    if (effectiveOpen) {
      fetchCars();
      fetchCartItems();
    }
  }, [effectiveOpen]);

  // Create mode: Total Units per LC follows the "add to list" count
  useEffect(() => {
    if (mode !== "create") return;
    const n = carEntries.length;
    if (n > 0) {
      hadCarEntriesInCreateRef.current = true;
      setFormData((prev) => ({ ...prev, total_units_per_lc: String(n) }));
    } else if (hadCarEntriesInCreateRef.current) {
      hadCarEntriesInCreateRef.current = false;
      setFormData((prev) => ({ ...prev, total_units_per_lc: null }));
    }
  }, [carEntries.length, mode]);

  useEffect(() => {
    if (mode === "create" && carEntries.length === 0) {
      setDraftFormExpanded(true);
      setEditingEntryIndex(null);
    }
  }, [carEntries.length, mode]);

  useEffect(() => {
    if (
      editingEntryIndex !== null &&
      (editingEntryIndex < 0 || editingEntryIndex >= carEntries.length)
    ) {
      setEditingEntryIndex(null);
    }
  }, [carEntries.length, editingEntryIndex]);

  const fetchCartItems = async () => {
    try {
      setLoadingCart(true);
      const response = await cartApi.getCartItems();
      if (response.success) {
        setCartItems(response.data.items || []);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchCars = async () => {
    try {
      setLoadingCars(true);
      const response = await carApi.getCars({ per_page: 1000 });
      if (response.success) {
        // Handle different possible response structures
        const carList = response.data?.data || response.data?.cars || [];
        setCars(Array.isArray(carList) ? carList : []);
      } else {
        setCars([]);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
    } finally {
      setLoadingCars(false);
    }
  };

  useEffect(() => {
    if (purchaseHistory && mode === "update") {
      const historyArray = Array.isArray(purchaseHistory) ? purchaseHistory : [purchaseHistory];
      const mainHistory = historyArray[0];

      // Prefill carEntries for bulk edit view
      if (historyArray.length > 1) {
        const entries: (CreatePurchaseHistoryData & { id?: number })[] = historyArray.map((ph) => {
          const { bid_price, ser_com } = resolveBidSerFromPh(ph);
          const hsCode = ph.hs_code ?? ph.car?.code ?? null;
          const priceAmount = ph.price_amount ?? ph.car?.price_amount ?? null;
          const priceBasis = ph.price_basis ?? ph.car?.price_basis ?? null;
          const fobValueUsd = ph.fob_value_usd ?? ph.car?.fob_value_usd ?? null;
          const freightUsd = ph.freight_usd ?? ph.car?.freight_usd ?? null;
          return {
          id: ph.id,
          car_id: ph.car_id,
          purchase_amount: ph.purchase_amount,
          foreign_amount: sumBidSer(bid_price, ser_com),
          bdt_amount: ph.bdt_amount ?? null,
          currency_type: ph.currency_type || "yen",
          govt_duty: ph.govt_duty,
          cnf_amount: ph.cnf_amount,
          miscellaneous: ph.miscellaneous,
          bid_price,
          ser_com,
          purchase_date: ph.purchase_date ? toInputDate(ph.purchase_date) : null,
          hs_code: hsCode,
          price_amount: priceAmount,
          price_basis: priceBasis,
          fob_value_usd: fobValueUsd,
          freight_usd: freightUsd,
        };
        });
        setCarEntries(entries);
      } else {
        setCarEntries([]);
      }

      setDollarToBdtRate(
        mainHistory.bdt_amount != null
          ? String(mainHistory.bdt_amount)
          : ""
      );

      setCurrencyType("yen");

      const { bid_price: rateBid, ser_com: rateSer } = resolveBidSerFromPh(mainHistory);
      const yenBasis =
        sumBidSer(rateBid, rateSer) ??
        (mainHistory.foreign_amount != null
          ? Number(mainHistory.foreign_amount)
          : null);

      if (
        mainHistory.currency_type === "yen" &&
        yenBasis &&
        yenBasis > 0 &&
        mainHistory.purchase_amount
      ) {
        const yenAmount = yenBasis;
        const finalBdt = mainHistory.purchase_amount;
        const dollarToBdt = mainHistory.bdt_amount || 0;

        if (yenAmount > 0 && dollarToBdt > 0) {
          const calculatedDollar = finalBdt / dollarToBdt;
          // Yen to Dollar Rate = yen per 1 USD, so rate = amount_yen / amount_usd
          const yenPerDollar = yenAmount / calculatedDollar;
          setYenToDollarRate(yenPerDollar.toString());
          setIntermediateDollar(calculatedDollar.toString());
        }
      }

      const { bid_price: preBid, ser_com: preSer } = resolveBidSerFromPh(mainHistory);

      const hsCode = mainHistory.hs_code ?? mainHistory.car?.code ?? null;
      const priceAmount = mainHistory.price_amount ?? mainHistory.car?.price_amount ?? null;
      const priceBasis = mainHistory.price_basis ?? mainHistory.car?.price_basis ?? null;
      const fobValueUsd = mainHistory.fob_value_usd ?? mainHistory.car?.fob_value_usd ?? null;
      const freightUsd = mainHistory.freight_usd ?? mainHistory.car?.freight_usd ?? null;

      const initialFormData: CreatePurchaseHistoryData = {
        car_ids: mainHistory.cars?.map(c => c.id) || (mainHistory.car_id ? [mainHistory.car_id] : []),
        car_id: mainHistory.car_id ?? null,
        purchase_date: toInputDate(mainHistory.purchase_date),
        purchase_amount: mainHistory.purchase_amount,
        foreign_amount: sumBidSer(preBid, preSer),
        bdt_amount: mainHistory.bdt_amount ?? null,
        currency_type: "yen",
        govt_duty: mainHistory.govt_duty || null,
        cnf_amount: mainHistory.cnf_amount || null,
        miscellaneous: mainHistory.miscellaneous || null,
        bid_price: preBid,
        ser_com: preSer,
        lc_date: toInputDate(mainHistory.lc_date),
        lc_number: mainHistory.lc_number || null,
        lc_bank_name: mainHistory.lc_bank_name || null,
        lc_bank_branch_name: mainHistory.lc_bank_branch_name || null,
        lc_bank_branch_address: mainHistory.lc_bank_branch_address || null,
        total_units_per_lc: mainHistory.total_units_per_lc || null,
        bill_of_lading: null,
        invoice_number: null,
        export_certificate: null,
        export_certificate_translated: null,
        bill_of_exchange_amount: null,
        custom_duty_copy_3pages: null,
        cheque_copy: null,
        certificate: null,
        custom_one: null,
        custom_two: null,
        custom_three: null,
        hs_code: hsCode,
        price_amount: priceAmount,
        price_basis: priceBasis,
        fob_value_usd: fobValueUsd,
        freight_usd: freightUsd,
      };

      setFormData(initialFormData);

      // Store existing file paths
      const pdfFields = [
        "bill_of_lading",
        "invoice_number",
        "export_certificate",
        "export_certificate_translated",
        "bill_of_exchange_amount",
        "custom_duty_copy_3pages",
        "cheque_copy",
        "certificate",
        "custom_one",
        "custom_two",
        "custom_three",
      ];

      const files: Record<string, string> = {};
      pdfFields.forEach((field) => {
        const value = mainHistory[field as keyof PurchaseHistory] as
          | string
          | null;
        if (value) files[field] = value;
      });
      setExistingFiles(files);
    } else if (!purchaseHistory && mode === "create") {
      // Reset form for create mode; optionally prefill LC from an existing group row
      const p = lcPrefillForCreate;
      setFormData({
        car_ids: [],
        car_id: null,
        purchase_date: null,
        purchase_amount: null,
        foreign_amount: null,
        bdt_amount: null,
        govt_duty: null,
        cnf_amount: null,
        miscellaneous: null,
        bid_price: p?.bid_price ?? null,
        ser_com: p?.ser_com ?? null,
        lc_date: p ? toInputDate(p.lc_date) : null,
        lc_number: p?.lc_number ?? null,
        lc_bank_name: p?.lc_bank_name ?? null,
        lc_bank_branch_name: p?.lc_bank_branch_name ?? null,
        lc_bank_branch_address: p?.lc_bank_branch_address ?? null,
        total_units_per_lc: null,
        bill_of_lading: null,
        invoice_number: null,
        export_certificate: null,
        export_certificate_translated: null,
        bill_of_exchange_amount: null,
        custom_duty_copy_3pages: null,
        cheque_copy: null,
        certificate: null,
        custom_one: null,
        custom_two: null,
        custom_three: null,
        hs_code: null,
        price_amount: null,
        price_basis: null,
        fob_value_usd: null,
        freight_usd: null,
        currency_type: p?.currency_type || "yen",
      });
      setForeignAmount("");
      setYenToDollarRate("");
      setDollarToBdtRate("");
      setIntermediateDollar("");
      setCurrencyType(
        p?.currency_type === "dollar" ? "dollar" : "yen"
      );
      setExistingFiles({});
      setCarEntries([]);
      setEditingEntryIndex(null);
      hadCarEntriesInCreateRef.current = false;
    }
  }, [purchaseHistory, mode, effectiveOpen, lcPrefillForCreate]);

  // foreign_amount / calculator input = bid_price + ser_com
  useEffect(() => {
    const b = formData.bid_price;
    const s = formData.ser_com;
    if (b != null || s != null) {
      setForeignAmount(String((Number(b) || 0) + (Number(s) || 0)));
    } else {
      setForeignAmount("");
    }
  }, [formData.bid_price, formData.ser_com]);

  // Calculate purchase_amount with two-step conversion for Yen
  useEffect(() => {
    const foreign = parseFloat(foreignAmount) || 0;
    let finalAmount = 0;
    let dollarEquivalent = foreign;

    if (currencyType === "yen") {
      // Step 1: Convert Yen to Dollar: Amount (JPY) / Yen-to-Dollar Rate = USD
      const yenToDollar = parseFloat(yenToDollarRate) || 0;
      dollarEquivalent = yenToDollar > 0 ? foreign / yenToDollar : 0;

      setIntermediateDollar(dollarEquivalent > 0 ? dollarEquivalent.toString() : "");
    } else {
      setIntermediateDollar("");
    }

    // Step 2: Convert Dollar to BDT
    const dollarToBdt = parseFloat(dollarToBdtRate) || 0;
    finalAmount = dollarEquivalent * dollarToBdt;

    setFormData((prev) => {
      // PROMPT FIX: Don't let the calculator overwrite existing purchase_amount with null/0
      // if inputs are empty during update prefill.
      if (mode === "update" && !foreignAmount && !dollarToBdtRate) {
        return prev;
      }

      return {
        ...prev,
        purchase_amount: finalAmount > 0 ? finalAmount : prev.purchase_amount,
        foreign_amount: !Number.isNaN(foreign) && foreignAmount !== "" ? foreign : prev.foreign_amount,
        bdt_amount: !Number.isNaN(parseFloat(dollarToBdtRate)) && dollarToBdtRate !== "" ? parseFloat(dollarToBdtRate) : prev.bdt_amount,
        currency_type: currencyType,
      };
    });
  }, [foreignAmount, yenToDollarRate, dollarToBdtRate, currencyType, mode]);

  const handleInputChange = (
    field: keyof CreatePurchaseHistoryData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const clearCarDraftFields = () => {
    setFormData((prev) => ({
      ...prev,
      car_id: null,
      car_ids: [],
      purchase_date: null,
      purchase_amount: null,
      foreign_amount: null,
      bdt_amount: null,
      govt_duty: null,
      cnf_amount: null,
      miscellaneous: null,
      bid_price: null,
      ser_com: null,
      bill_of_lading: null,
      invoice_number: null,
      export_certificate: null,
      export_certificate_translated: null,
      bill_of_exchange_amount: null,
      custom_duty_copy_3pages: null,
      cheque_copy: null,
      certificate: null,
      custom_one: null,
      custom_two: null,
      custom_three: null,
      hs_code: null,
      price_amount: null,
      price_basis: null,
      fob_value_usd: null,
      freight_usd: null,
    }));
    setForeignAmount("");
    setYenToDollarRate("");
    setDollarToBdtRate("");
    setIntermediateDollar("");
    setExistingFiles({});
  };

  const applyEntryToDraftForm = (entry: CreatePurchaseHistoryData) => {
    const ct: "dollar" | "yen" =
      entry.currency_type === "dollar" ? "dollar" : "yen";
    setCurrencyType(ct);

    const bid = entry.bid_price ?? null;
    const ser = entry.ser_com ?? null;
    const sumForeign = sumBidSer(bid, ser);
    const sumStr =
      sumForeign != null && !Number.isNaN(Number(sumForeign))
        ? String(sumForeign)
        : "";

    setFormData((prev) => ({
      ...prev,
      car_id: entry.car_id ?? null,
      car_ids: entry.car_id ? [entry.car_id] : [],
      purchase_date: entry.purchase_date ?? null,
      purchase_amount: entry.purchase_amount ?? null,
      foreign_amount: sumForeign,
      bdt_amount: entry.bdt_amount ?? null,
      bid_price: bid,
      ser_com: ser,
      govt_duty: entry.govt_duty ?? null,
      cnf_amount: entry.cnf_amount ?? null,
      miscellaneous: entry.miscellaneous ?? null,
      hs_code: entry.hs_code ?? null,
      price_amount: entry.price_amount ?? null,
      price_basis: entry.price_basis ?? null,
      fob_value_usd: entry.fob_value_usd ?? null,
      freight_usd: entry.freight_usd ?? null,
      bill_of_lading: entry.bill_of_lading ?? null,
      invoice_number: entry.invoice_number ?? null,
      export_certificate: entry.export_certificate ?? null,
      export_certificate_translated: entry.export_certificate_translated ?? null,
      bill_of_exchange_amount: entry.bill_of_exchange_amount ?? null,
      custom_duty_copy_3pages: entry.custom_duty_copy_3pages ?? null,
      cheque_copy: entry.cheque_copy ?? null,
      certificate: entry.certificate ?? null,
      custom_one: entry.custom_one ?? null,
      custom_two: entry.custom_two ?? null,
      custom_three: entry.custom_three ?? null,
      currency_type: ct,
    }));

    setForeignAmount(sumStr);
    setDollarToBdtRate(
      entry.bdt_amount != null ? String(entry.bdt_amount) : ""
    );

    if (ct === "yen") {
      const yenBasis =
        sumForeign != null && !Number.isNaN(Number(sumForeign))
          ? Number(sumForeign)
          : 0;
      const finalBdt = entry.purchase_amount;
      const dollarToBdt = entry.bdt_amount;
      if (
        yenBasis > 0 &&
        finalBdt != null &&
        Number(finalBdt) > 0 &&
        dollarToBdt != null &&
        Number(dollarToBdt) > 0
      ) {
        const calculatedDollar = Number(finalBdt) / Number(dollarToBdt);
        const yenPerDollar = yenBasis / calculatedDollar;
        setYenToDollarRate(yenPerDollar.toString());
        setIntermediateDollar(calculatedDollar.toString());
      } else {
        setYenToDollarRate("");
        setIntermediateDollar("");
      }
    } else {
      setYenToDollarRate("");
      setIntermediateDollar("");
    }

    setExistingFiles({});
  };

  const handleStartEditEntry = (index: number) => {
    const entry = carEntries[index];
    if (!entry) return;
    setEditingEntryIndex(index);
    applyEntryToDraftForm(entry);
    setDraftFormExpanded(true);
    setCarSearchQuery("");
    setIsCarDropdownOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingEntryIndex(null);
    clearCarDraftFields();
    if (carEntries.length > 0) {
      setDraftFormExpanded(false);
    } else {
      setDraftFormExpanded(true);
    }
  };

  const handleAddNewDraft = () => {
    setEditingEntryIndex(null);
    clearCarDraftFields();
    setDraftFormExpanded(true);
    setCarSearchQuery("");
    setIsCarDropdownOpen(false);
  };

  /** Collapse the three-part draft without saving (new car only). */
  const handleMinimizeDraft = () => {
    if (editingEntryIndex !== null) return;
    clearCarDraftFields();
    if (carEntries.length > 0) {
      setDraftFormExpanded(false);
    }
  };

  const handleAddEntry = () => {
    if (!formData.car_id) {
      return;
    }

    const duplicate = carEntries.some(
      (e, i) => e.car_id === formData.car_id && i !== editingEntryIndex
    );
    if (duplicate) {
      return;
    }

    const newEntry: CreatePurchaseHistoryData = {
      car_id: formData.car_id,
      purchase_amount: formData.purchase_amount,
      foreign_amount: sumBidSer(formData.bid_price, formData.ser_com),
      bdt_amount: formData.bdt_amount,
      currency_type: currencyType,
      govt_duty: formData.govt_duty,
      cnf_amount: formData.cnf_amount,
      miscellaneous: formData.miscellaneous,
      bid_price: formData.bid_price ?? null,
      ser_com: formData.ser_com ?? null,
      purchase_date: formData.purchase_date,

      bill_of_lading: formData.bill_of_lading,
      invoice_number: formData.invoice_number,
      export_certificate: formData.export_certificate,
      export_certificate_translated: formData.export_certificate_translated,
      bill_of_exchange_amount: formData.bill_of_exchange_amount,
      custom_duty_copy_3pages: formData.custom_duty_copy_3pages,
      cheque_copy: formData.cheque_copy,
      certificate: formData.certificate,
      custom_one: formData.custom_one,
      custom_two: formData.custom_two,
      custom_three: formData.custom_three,
      hs_code: formData.hs_code,
      price_amount: formData.price_amount,
      price_basis: formData.price_basis,
      fob_value_usd: formData.fob_value_usd,
      freight_usd: formData.freight_usd,
    };

    if (editingEntryIndex !== null) {
      setCarEntries((prev) =>
        prev.map((e, i) => (i === editingEntryIndex ? newEntry : e))
      );
      setEditingEntryIndex(null);
    } else {
      setCarEntries((prev) => [...prev, newEntry]);
    }
    setDraftFormExpanded(false);

    clearCarDraftFields();
  };

  const handleRemoveEntry = (index: number) => {
    setCarEntries((prev) => prev.filter((_, i) => i !== index));
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
      clearCarDraftFields();
    } else if (editingEntryIndex !== null && editingEntryIndex > index) {
      setEditingEntryIndex((e) => (e != null ? e - 1 : null));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Common data from the top section (LC Info)
    const sharedData = {
      lc_date: formData.lc_date,
      lc_number: formData.lc_number,
      lc_bank_name: formData.lc_bank_name,
      lc_bank_branch_name: formData.lc_bank_branch_name,
      lc_bank_branch_address: formData.lc_bank_branch_address,
      total_units_per_lc: formData.total_units_per_lc,
      // Shared Files
      bill_of_lading: formData.bill_of_lading,
      invoice_number: formData.invoice_number,
      export_certificate: formData.export_certificate,
      export_certificate_translated: formData.export_certificate_translated,
      bill_of_exchange_amount: formData.bill_of_exchange_amount,
      custom_duty_copy_3pages: formData.custom_duty_copy_3pages,
      cheque_copy: formData.cheque_copy,
      certificate: formData.certificate,
      custom_one: formData.custom_one,
      custom_two: formData.custom_two,
      custom_three: formData.custom_three,
    };

    if (carEntries.length > 0) {
      // If we have carEntries, we process them as a list
      const bulkData = carEntries.map(entry => ({
        ...sharedData,
        ...entry
      }));

      // @ts-ignore
      onSubmit(bulkData);
    } else {
      // Single item update/create
      onSubmit({
        ...formData,
        ...sharedData
      });
    }
  };

  const getPdfUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // @ts-ignore
    const baseUrl =
      (import.meta as any).env?.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:8000";
    return `${baseUrl}${path}`;
  };

  const getFileName = (filePath: string | File): string => {
    if (filePath instanceof File) {
      return filePath.name;
    }
    // Extract filename from path
    return filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown file';
  };

  if (variant === "modal" && !isOpen) return null;

  const pdfFields = [
    { key: "bill_of_lading", label: "Bill of Lading" },
    { key: "invoice_number", label: "Invoice Number" },
    { key: "export_certificate", label: "Export Certificate" },
    {
      key: "export_certificate_translated",
      label: "Export Certificate (Translated)",
    },
    { key: "bill_of_exchange_amount", label: "Bill of Exchange Amount" },
    { key: "custom_duty_copy_3pages", label: "Custom Duty Copy (3 Pages)" },
    { key: "cheque_copy", label: "Cheque Copy" },
    { key: "certificate", label: "Certificate" },
    { key: "custom_one", label: "Custom One" },
    { key: "custom_two", label: "Custom Two" },
    { key: "custom_three", label: "Custom Three" },
  ];

  const renderPdfAttachmentField = (field: (typeof pdfFields)[number]) => {
    const existingFile = existingFiles[field.key];
    const newFile =
      formData[field.key as keyof CreatePurchaseHistoryData] instanceof File
        ? (formData[field.key as keyof CreatePurchaseHistoryData] as File)
        : null;

    return (
      <div key={field.key} className="min-w-0">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 leading-snug">
          {field.label}
        </label>

        {existingFile && (
          <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-primary-700 uppercase">Current</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newExistingFiles = { ...existingFiles };
                  delete newExistingFiles[field.key];
                  setExistingFiles(newExistingFiles);
                }}
                className="text-red-600 hover:text-red-700 p-1"
                title="Remove existing file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <FileIcon className="w-4 h-4 shrink-0 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {getFileName(existingFile)}
                </p>
              </div>
            </div>
          </div>
        )}

        {newFile && (
          <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-green-700 uppercase">New</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleFileChange(field.key, null);
                }}
                className="text-red-600 hover:text-red-700 p-1"
                title="Remove new file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <FileIcon className="w-4 h-4 shrink-0 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {getFileName(newFile)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {(newFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        )}

        {!newFile && (
          <label className="flex flex-col items-center justify-center w-full min-h-[7rem] border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center py-3 px-2">
              <Upload className="w-6 h-6 mb-1 text-gray-400" />
              <p className="text-xs text-gray-500 text-center">
                {existingFile ? "Replace file" : "Upload PDF"}
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(field.key, file);
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  const isPage = variant === "page";

  /** Single record or create: show vehicle/pricing/docs block. Bulk array update uses LC only here. */
  const showCarPurchaseSection =
    mode === "create" || !Array.isArray(purchaseHistory);

  /** Create mode: hide the big draft (car + pricing + docs) after adding to list until user adds another. */
  const showDraftCarForm =
    mode !== "create" || carEntries.length === 0 || draftFormExpanded;

  const showDocumentAttachmentsSection =
    mode === "create"
      ? showDraftCarForm
      : !Array.isArray(purchaseHistory);

  /** Same collapse as Add Car to Purchase + Document Attachments in create mode. */
  const showCurrentEntryDetailsSection =
    mode === "create"
      ? showDraftCarForm
      : !Array.isArray(purchaseHistory);
  const isCreateSubmitDisabled =
    mode === "create" && (carEntries.length === 0 || showDraftCarForm);

  const renderSections = () => (
    <>
            {/* 1. LC Information (Common) - Moved to Top */}
            <PurchaseFormSection variant={variant}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                LC Information <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">Shared across all cars</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LC Date
                    </label>
                    <input
                      type="date"
                      value={formData.lc_date || ""}
                      onChange={(e) =>
                        handleInputChange("lc_date", e.target.value || null)
                      }
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Units per LC
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.total_units_per_lc || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "total_units_per_lc",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LC Number
                    </label>
                    <input
                      type="text"
                      value={formData.lc_number || ""}
                      onChange={(e) =>
                        handleInputChange("lc_number", e.target.value || null)
                      }
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LC Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.lc_bank_name || ""}
                      onChange={(e) =>
                        handleInputChange("lc_bank_name", e.target.value || null)
                      }
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LC Bank Branch Name
                    </label>
                    <input
                      type="text"
                      value={formData.lc_bank_branch_name || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "lc_bank_branch_name",
                          e.target.value || null
                        )
                      }
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LC Bank Branch Address
                  </label>
                  <textarea
                    value={formData.lc_bank_branch_address || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "lc_bank_branch_address",
                        e.target.value || null
                      )
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
              </div>
            </PurchaseFormSection>
            {variant === "modal" && (
              <div className="border-t border-gray-200 my-6" />
            )}

            {showCarPurchaseSection && (
            <div
              className={
                isPage
                  ? "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden ring-1 ring-slate-100/80 dark:ring-slate-800"
                  : "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
              }
            >
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Car & purchase details
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Per vehicle: add cars, pricing, and document attachments. LC is a separate section above.
                  {mode === "create" && (
                    <>
                      {" "}
                      Click a car row or <span className="font-medium text-gray-800 dark:text-gray-200">Add new</span> to open the full draft. After <span className="font-medium text-gray-800 dark:text-gray-200">Add Car to List</span>, it minimizes again.
                    </>
                  )}
                </p>
              </div>
              <div className="p-5 sm:p-6 space-y-6">

            {/* Added cars — minimized rows + add another / remove */}
            {mode === "create" && carEntries.length > 0 && (
              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/30 dark:to-gray-800/80 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Added to list
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-700">
                      {carEntries.length} car{carEntries.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  {!draftFormExpanded && (
                    <button
                      type="button"
                      onClick={handleAddNewDraft}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary-500 bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 dark:border-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500"
                      aria-label="Add new"
                      title="Add new"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {carEntries.map((entry, idx) => {
                    const car = cars.find((c) => c.id === entry.car_id);
                    const title = car
                      ? `${car.make} ${car.model}`
                      : `Car #${entry.car_id}`;
                    const sub = car
                      ? car.chassis_no_full || car.chassis_no_masked || ""
                      : "";
                    const isDraftOpenForThisRow =
                      showDraftCarForm && editingEntryIndex === idx;
                    const isEditingCard = editingEntryIndex === idx;
                    return (
                      <li
                        key={`${entry.car_id}-${idx}`}
                        className={`flex min-h-[3rem] items-center gap-2 rounded-xl border bg-white/95 px-3 py-2.5 shadow-sm transition dark:bg-gray-800/90 ${
                          isEditingCard
                            ? "border-primary-500 ring-2 ring-primary-200 dark:border-primary-400 dark:ring-primary-900/50"
                            : "border-gray-200/90 cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-600 dark:hover:border-primary-600 dark:hover:bg-primary-950/20"
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (showDraftCarForm && editingEntryIndex === idx) {
                            handleCancelEdit();
                          } else {
                            handleStartEditEntry(idx);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (showDraftCarForm && editingEntryIndex === idx) {
                              handleCancelEdit();
                            } else {
                              handleStartEditEntry(idx);
                            }
                          }
                        }}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {title}
                          </span>
                          {sub ? (
                            <span className="truncate text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {sub}
                            </span>
                          ) : null}
                          <span className="text-xs text-gray-600 dark:text-gray-300 sm:ml-auto">
                            {entry.purchase_amount != null
                              ? `৳ ${Number(entry.purchase_amount).toLocaleString()}`
                              : "—"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDraftOpenForThisRow) {
                              handleCancelEdit();
                            } else {
                              handleStartEditEntry(idx);
                            }
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-950/60 dark:hover:text-primary-300"
                          aria-label={
                            isDraftOpenForThisRow
                              ? "Minimize draft (collapse)"
                              : "Open draft for this car"
                          }
                          title={
                            isDraftOpenForThisRow
                              ? "Minimize"
                              : "Open to edit"
                          }
                        >
                          {isDraftOpenForThisRow ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEntry(idx);
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                          aria-label="Remove from list"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* From cart */}
            {mode === "create" && showDraftCarForm && cartItems.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> From Cart List ({cartItems.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cartItems.map((item) => {
                    const isSelected = formData.car_id === item.car_id || (formData.car_ids || []).includes(item.car_id);
                    const isAlreadyAdded = carEntries.some(
                      (e, i) => e.car_id === item.car_id && i !== editingEntryIndex
                    );

                    if (isAlreadyAdded) return null;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          handleInputChange("car_id", item.car_id);
                          handleInputChange("car_ids", [item.car_id]);
                          // Optionally pre-fill other fields from car if needed
                        }}
                        className={`p-4 rounded-xl border bg-white dark:bg-gray-800 cursor-pointer transition-all hover:shadow-md dark:border-gray-600 ${isSelected ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/40' : 'border-gray-200 dark:border-gray-600'}`}
                      >
                        <div className="font-bold text-gray-900">{item.car.make} {item.car.model}</div>
                        <div className="text-xs text-gray-500 mt-1">Ref: {(item.car as any).ref_no || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{(item.car as any).chassis_no_full || (item.car as any).chassis_no_masked || 'No Chassis'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Car to Purchase */}
            {mode === "create" && showDraftCarForm && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Add Car to Purchase
                  </h3>
                  {(editingEntryIndex === null &&
                    ((formData.car_id != null && formData.car_id !== 0) ||
                      (formData.car_ids && formData.car_ids.length > 0))) && (
                    <button
                      type="button"
                      onClick={handleMinimizeDraft}
                      className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                      aria-label="Remove draft car selection"
                      title="Remove draft"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">
                  Complete pricing and documents below, then click <span className="font-medium text-gray-800 dark:text-gray-200">Add Car to List</span> under Document Attachments.
                </p>

                {/* Car selection + Purchase Date + H.S Code — one row on lg+ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="relative min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Car to Add
                    </label>

                    {/* Selected Car Display */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(formData.car_id ? [formData.car_id] : (formData.car_ids || [])).map(id => {
                        let car: any = cars.find(c => c.id === id);
                        if (!car && mainHistory?.cars) {
                          car = mainHistory.cars.find((c: any) => c.id === id);
                        }
                        if (!car) return null;

                        return (
                          <div key={id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between w-full border border-gray-200 dark:border-gray-600">
                            <span>{car.make} {car.model} — <span className="text-gray-500 dark:text-gray-400 font-normal">{car.chassis_no_full || car.chassis_no_masked}</span></span>
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange("car_id", null);
                                handleInputChange("car_ids", []);
                              }}
                              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Search Input */}
                    {!formData.car_id && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search cars by make, model, chassis..."
                          value={carSearchQuery}
                          onChange={(e) => {
                            setCarSearchQuery(e.target.value);
                            setIsCarDropdownOpen(true);
                          }}
                          onFocus={() => setIsCarDropdownOpen(true)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />

                        {isCarDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {loadingCars ? (
                              <div className="p-4 text-center text-gray-500 text-sm">Loading cars...</div>
                            ) : (
                              <>
                                {cars
                                  .filter(car => {
                                    const searchStr = `${car.make} ${car.model} ${car.chassis_no_full || ""} ${car.chassis_no_masked || ""}`.toLowerCase();
                                    return searchStr.includes(carSearchQuery.toLowerCase());
                                  })
                                  .map(car => {
                                    const isAlreadyAdded = carEntries.some(
                                      (e, i) => e.car_id === car.id && i !== editingEntryIndex
                                    );
                                    if (isAlreadyAdded) return null;
                                    return (
                                      <div
                                        key={car.id}
                                        onClick={() => {
                                          handleInputChange("car_id", car.id);
                                          handleInputChange("car_ids", [car.id]);
                                          setIsCarDropdownOpen(false);
                                          setCarSearchQuery("");
                                        }}
                                        className="px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/80"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{car.make} {car.model}</span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">{car.chassis_no_full || car.chassis_no_masked}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date || ""}
                      onChange={(e) => handleInputChange("purchase_date", e.target.value || null)}
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      H.S Code
                    </label>
                    <input
                      type="text"
                      value={formData.hs_code || ""}
                      onChange={(e) => handleInputChange("hs_code", e.target.value || null)}
                      className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Current Entry Details — with Add Car to Purchase + Document Attachments as one draft block in create */}
            {showCurrentEntryDetailsSection && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  {mode === 'create' ? "Current Entry Details" : "Car & Financial Details"}
                </h3>

                {/* Purchase Date and H.S Code — edit single record only (create flow uses Add Car section) */}
                {mode === "update" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={formData.purchase_date || ""}
                        onChange={(e) => handleInputChange("purchase_date", e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        H.S Code
                      </label>
                      <input
                        type="text"
                        value={formData.hs_code || ""}
                        onChange={(e) => handleInputChange("hs_code", e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>
                  </div>
                )}

                {/* Calculator section from line 1040 original... */}

                {/* Purchase Amount Calculation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                    Purchase Price & Financial Details
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-700">Currency:</span>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={currencyType === "dollar"}
                        onChange={(e) => e.target.checked && setCurrencyType("dollar")}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Dollar
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={currencyType === "yen"}
                        onChange={(e) => e.target.checked && setCurrencyType("yen")}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Yen
                    </label>
                  </div>
                  <div className="space-y-4">
                    {/* Row 1: 1–5 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {currencyType === "yen" ? (
                        <>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              1. BID
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.bid_price ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "bid_price",
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              2. SER+COM
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.ser_com ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "ser_com",
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              3. Amount (JPY)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={foreignAmount}
                              readOnly
                              title="Sum of BID and SER+COM"
                              placeholder="0.00"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-800 font-medium"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              4. JPY per 1 USD
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={yenToDollarRate}
                              onChange={(e) => setYenToDollarRate(e.target.value)}
                              placeholder="0.0000"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              5. Calc. USD
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={intermediateDollar}
                              readOnly
                              placeholder="USD"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 font-medium"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              1. BID
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.bid_price ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "bid_price",
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              2. SER+COM
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.ser_com ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "ser_com",
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              3. Amount (USD)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={foreignAmount}
                              readOnly
                              title="Sum of BID and SER+COM"
                              placeholder="0.00"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-800 font-medium"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              4. USD → BDT (৳)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={dollarToBdtRate}
                              onChange={(e) => setDollarToBdtRate(e.target.value)}
                              placeholder="0.00"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              5. Total (BDT)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.purchase_amount || ""}
                              readOnly
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-200 text-gray-700 font-bold"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Row 2: 6–10 (Yen: 6–8 + Govt + CNF; Dollar: placeholders + Govt + CNF) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {currencyType === "yen" ? (
                        <>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              6. Amount (USD)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={intermediateDollar}
                              readOnly
                              placeholder="USD Amount"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 font-medium"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              7. Dollar to BDT (৳)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={dollarToBdtRate}
                              onChange={(e) => setDollarToBdtRate(e.target.value)}
                              placeholder="0.00"
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              8. Total (BDT)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.purchase_amount || ""}
                              readOnly
                              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-gray-200 text-gray-700 font-bold"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="min-w-0 hidden lg:block" aria-hidden />
                          <div className="min-w-0 hidden lg:block" aria-hidden />
                          <div className="min-w-0 hidden lg:block" aria-hidden />
                        </>
                      )}
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          9. Govt Duty
                        </label>
                        <input
                          type="text"
                          value={formData.govt_duty || ""}
                          onChange={(e) => handleInputChange("govt_duty", e.target.value || null)}
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          10. CNF Amount
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.cnf_amount || ""}
                          onChange={(e) =>
                            handleInputChange("cnf_amount", e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    {/* Row 3: 11–15 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          11. Miscellaneous
                        </label>
                        <input
                          type="text"
                          value={formData.miscellaneous || ""}
                          onChange={(e) => handleInputChange("miscellaneous", e.target.value || null)}
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          12. Price Amount
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.price_amount || ""}
                          onChange={(e) =>
                            handleInputChange("price_amount", e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          13. Price Basis
                        </label>
                        <input
                          type="text"
                          value={formData.price_basis || ""}
                          onChange={(e) => handleInputChange("price_basis", e.target.value || null)}
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          14. FOB Value (USD)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.fob_value_usd || ""}
                          onChange={(e) =>
                            handleInputChange("fob_value_usd", e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          15. Freight (USD)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.freight_usd || ""}
                          onChange={(e) =>
                            handleInputChange("freight_usd", e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Document Attachments */}
            {showDocumentAttachmentsSection && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Document Attachments
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {pdfFields.slice(0, 6).map((field) => renderPdfAttachmentField(field))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {pdfFields.slice(6).map((field) => renderPdfAttachmentField(field))}
                  </div>
                </div>
              </div>
            )}

            {mode === "create" && showDraftCarForm && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-2 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  {carEntries.length > 0 && editingEntryIndex === null && (
                    <button
                      type="button"
                      onClick={handleMinimizeDraft}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/80"
                      aria-label="Minimize draft"
                      title="Minimize draft"
                    >
                      {/* Draft is currently open; point down */}
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Add Car to List
                  </button>
                </div>
              </div>
            )}

              </div>
            </div>
            )}

            {/* Actions */}
            {isPage ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md border border-red-700/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreateSubmitDisabled}
                    className={`px-8 py-3 text-white rounded-xl font-semibold transition-all duration-200 ${
                      isCreateSubmitDisabled
                        ? "bg-green-600/60 blur-[0.4px] cursor-not-allowed opacity-70"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/20 hover:shadow-xl"
                    }`}
                  >
                    {mode === "create"
                      ? carEntries.length > 0
                        ? `Submit All (${carEntries.length} Cars)`
                        : "Create"
                      : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreateSubmitDisabled}
                  className={`px-6 py-2 text-white rounded-xl transition-colors font-medium ${
                    isCreateSubmitDisabled
                      ? "bg-primary-600/60 blur-[0.4px] cursor-not-allowed opacity-70"
                      : "bg-primary-600 hover:bg-primary-700"
                  }`}
                >
                  {mode === "create"
                    ? carEntries.length > 0
                      ? `Submit All (${carEntries.length} Cars)`
                      : "Create"
                    : "Update"}
                </button>
              </div>
            )}
    </>
  );

  return (
    <div
      className={
        isPage
          ? "w-full"
          : "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      }
    >
      {isPage ? (
        <form
          onSubmit={handleSubmit}
          className="w-full px-8 pt-3 pb-8"
        >
          <div className="space-y-5">{renderSections()}</div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden my-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {mode === "create"
                  ? "Create Purchase History"
                  : "Update Purchase History"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto max-h-[calc(95vh-120px)]"
          >
            <div className="p-6 space-y-6">{renderSections()}</div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryModal;
