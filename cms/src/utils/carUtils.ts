export const formatPrice = (amount?: number, currency?: string) => {
  if (amount === undefined || amount === null) return "Price on request";

  const formattedAmount = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const resolvedCurrency = (currency || "BDT").toUpperCase();
  const currencyLabel = resolvedCurrency === "USD" ? "BDT" : resolvedCurrency;

  return `${currencyLabel} ${formattedAmount}`;
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    case "sold":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    case "reserved":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    case "in_transit":
      return "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
  }
};

export const getGradeColor = (grade?: string | number) => {
  if (!grade) return "bg-gray-100 text-gray-800";
  const numGrade = typeof grade === "string" ? parseFloat(grade) : grade;
  if (numGrade >= 8) return "bg-green-100 text-green-800";
  if (numGrade >= 6) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

/**
 * Convert a vehicle color value (often a name or hex) into a valid CSS color.
 * If the value can't be used directly, generate a deterministic fallback.
 */
export const getCssColor = (color?: string | null): string => {
  const raw = color?.trim();
  if (!raw) return "#9CA3AF"; // Tailwind gray-400

  const normalized = raw.startsWith("#") ? raw : raw.toLowerCase();

  // Fast-path for hex/rgb/hsl-ish inputs.
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(normalized)) return raw;

  // Named CSS colors (e.g. "red", "silver")
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    try {
      if (CSS.supports("color", normalized)) return normalized;
    } catch {
      // ignore and fall back below
    }
  }

  // Deterministic fallback: hash string -> HSL.
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 360;
  }

  return `hsl(${hash} 60% 55%)`;
};

export const getStockStatusColor = (quantity: number, status: string) => {
  if (quantity === 0) return "text-red-600";
  if (quantity <= 2) return "text-amber-600";
  return "text-green-600";
};

export const getStockStatusTextColor = (quantity: number, status: string) => {
  if (quantity === 0) return "text-red-500";
  if (quantity <= 2) return "text-amber-500";
  return "text-green-500";
};
