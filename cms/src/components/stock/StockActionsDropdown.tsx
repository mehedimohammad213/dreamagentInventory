import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";
import clsx from "clsx";

export type StockActionVariant =
  | "default"
  | "primary"
  | "amber"
  | "danger"
  | "success";

export interface StockActionMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: StockActionVariant;
  hidden?: boolean;
}

/** Width per icon slot in the horizontal toolbar */
const ICON_CELL_PX = 40;
const MENU_X_PADDING_PX = 8; /* matches px-1 on menu container */
/** Toolbar row height + mt/mb gap — used to flip menu above trigger near bottom edges */
const MENU_APPROX_HEIGHT_PX = 48;

function nearestOverflowAncestor(el: HTMLElement | null): HTMLElement | null {
  let p: HTMLElement | null = el?.parentElement ?? null;
  while (p) {
    const { overflow, overflowX, overflowY } = getComputedStyle(p);
    const oy = overflowY !== "visible" ? overflowY : overflow;
    const ox = overflowX !== "visible" ? overflowX : overflow;
    if (
      /(auto|scroll|overlay|hidden)/.test(oy) ||
      /(auto|scroll|overlay|hidden)/.test(ox)
    ) {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}

const variantRowClass: Record<StockActionVariant, string> = {
  default: "text-gray-700 hover:bg-gray-50",
  primary: "text-primary-600 hover:bg-primary-50",
  amber: "text-amber-600 hover:bg-amber-50",
  danger: "text-red-600 hover:bg-red-50",
  success: "text-green-600 hover:bg-green-50",
};

const variantIconClass: Record<StockActionVariant, string> = {
  default: "text-gray-600",
  primary: "text-primary-600",
  amber: "text-amber-600",
  danger: "text-red-600",
  success: "text-green-600",
};

interface StockActionsDropdownProps {
  items: StockActionMenuItem[];
}

/**
 * Kebab (⋮) trigger; opens a horizontal icon-only toolbar (`label` is for tooltip / a11y).
 * Opens upward when there is not enough room below (viewport or overflow ancestor),
 * so last-row menus are not clipped by table/card overflow.
 */
const StockActionsDropdown: React.FC<StockActionsDropdownProps> = ({
  items,
}) => {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter((i) => !i.hidden);

  const menuWidth =
    visibleItems.length * ICON_CELL_PX + MENU_X_PADDING_PX;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const el = triggerRef.current;
    const rect = el.getBoundingClientRect();
    const clip = nearestOverflowAncestor(el);
    let spaceBelow = window.innerHeight - rect.bottom;
    let spaceAbove = rect.top;
    if (clip) {
      const cr = clip.getBoundingClientRect();
      spaceBelow = Math.min(spaceBelow, cr.bottom - rect.bottom);
      spaceAbove = Math.min(spaceAbove, rect.top - cr.top);
    }
    const preferUp =
      spaceBelow < MENU_APPROX_HEIGHT_PX && spaceAbove >= MENU_APPROX_HEIGHT_PX;
    setOpenUpward(preferUp);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div
      className="relative z-30 flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ width: menuWidth }}
          className={clsx(
            "absolute right-0 z-[60] flex flex-row items-center rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-lg",
            openUpward ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const v = item.variant ?? "default";
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                title={item.label}
                aria-label={item.label}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                style={{ width: ICON_CELL_PX, minWidth: ICON_CELL_PX }}
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-md p-2 transition-colors",
                  variantRowClass[v]
                )}
              >
                <Icon className={clsx("h-5 w-5 shrink-0", variantIconClass[v])} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockActionsDropdown;
