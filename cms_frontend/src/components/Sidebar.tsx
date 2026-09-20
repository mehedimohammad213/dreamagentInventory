"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChartIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CarIcon,
  // ShoppingCartIcon,
  // UserIcon,
  PackageIcon,
  UsersIcon,
  CreditCard,
} from "lucide-react";
import type { StockPageTab } from "./stock/StockHeader";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const BdtIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={`inline-flex items-center justify-center font-extrabold leading-none text-lg text-current ${className ?? ""
      }`}
  >
    ৳
  </span>
);

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isOnStockRoute = location.pathname === "/admin/stock";
  const [stockSubmenuOpen, setStockSubmenuOpen] = useState(isOnStockRoute);

  const allowedStockTabs: StockPageTab[] =
    user.role === "admin"
      ? ["all", "current"]
      : ["current"];
  const defaultStockTab: StockPageTab =
    user.role === "user" ? "current" : "all";
  const tabParam = new URLSearchParams(location.search).get("tab");
  const effectiveStockTab: StockPageTab =
    tabParam && allowedStockTabs.includes(tabParam as StockPageTab)
      ? (tabParam as StockPageTab)
      : defaultStockTab;

  const isOnPurchaseRoute = location.pathname === "/admin/purchase-history";
  type PurchaseTab = "lc_wise" | "history";
  const [purchaseSubmenuOpen, setPurchaseSubmenuOpen] = useState(
    isOnPurchaseRoute
  );
  const allowedPurchaseTabs: PurchaseTab[] = ["lc_wise", "history"];
  const purchaseTabParam = new URLSearchParams(location.search).get("tab");
  const effectivePurchaseTab: PurchaseTab =
    purchaseTabParam && allowedPurchaseTabs.includes(purchaseTabParam as PurchaseTab)
      ? (purchaseTabParam as PurchaseTab)
      : "lc_wise";


  const adminNavItems: NavItem[] = [
    { path: "/admin", label: "Dashboard", icon: BarChartIcon },
    { path: "/admin/stock", label: "Stock", icon: PackageIcon },
    { path: "/admin/purchase-history", label: "Purchase", icon: BdtIcon },
    { path: "/admin/payment-history", label: "Payment", icon: CreditCard },
    // { path: "/admin/orders", label: "Orders", icon: ShoppingCartIcon },
    { path: "/admin/users", label: "Users", icon: UsersIcon },
  ];

  const userNavItems: NavItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: BarChartIcon },
    { path: "/admin/stock", label: "Stock", icon: PackageIcon },
    { path: "/admin/payment-history", label: "Payment", icon: CreditCard },
    // { path: "/cart", label: "Cart", icon: ShoppingCartIcon },
    // { path: "/orders", label: "Orders", icon: UserIcon },
  ];

  const navItems = user.role === "admin" ? adminNavItems : userNavItems;

  useEffect(() => {
    // Keep only the current route submenu open.
    setStockSubmenuOpen(isOnStockRoute);
    setPurchaseSubmenuOpen(isOnPurchaseRoute);
  }, [isOnStockRoute, isOnPurchaseRoute]);

  return (
    <aside
      className={`hidden lg:block relative shrink-0 overflow-y-auto no-vertical-scrollbar rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm ${collapsed ? "w-16" : "w-64"
        }`}
      aria-label="Sidebar navigation"
    >
      <div
        className={`h-[calc(100vh-2rem)] py-4 ${collapsed ? "px-2" : "px-3"
          } flex flex-col`}
      >
        {/* Toolbar */}
        <div
          className={`relative pb-4 mb-4 ${collapsed ? "px-1" : "px-2"
            }`}
        >
          <div
            className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""
              }`}
          >
            <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
              <CarIcon className="h-5 w-5 text-white" />
            </div>

            {!collapsed && (
              <div className="text-xs font-medium tracking-wider text-gray-600 dark:text-gray-300 whitespace-nowrap">
                DREAM AGENT CAR VISION
              </div>
            )}
          </div>
        </div>

        {/* Card-edge collapse handle (centered between sidebar and header cards) */}
        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-14 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <nav className="flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            // Custom "Stock" submenu.
            if (item.path === "/admin/stock") {
              const stockMainPath = `/admin/stock?tab=${effectiveStockTab}`;

              const stockTabLinkClasses = (tab: StockPageTab) =>
                `flex items-center w-full transition-colors py-2 rounded-none ${collapsed
                  ? "justify-center px-0 border-l-0"
                  : "justify-start gap-3 px-3 border-l-4 border-transparent"
                } ${effectiveStockTab === tab
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200 border-primary-500"
                  : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                }`;

              return (
                <div key={item.path}>
                  <Link
                    to={stockMainPath}
                    onClick={() => {
                      setStockSubmenuOpen((v) => !v);
                      setPurchaseSubmenuOpen(false);
                    }}
                    className={`flex items-center w-full transition-colors py-2 rounded-none ${collapsed
                      ? "justify-center px-0 border-l-0"
                      : "justify-start gap-3 px-3 border-l-4 border-transparent"
                      } ${isActive
                        ? collapsed
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200"
                          : "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200 border-primary-500"
                        : collapsed
                          ? "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={`truncate ${collapsed ? "hidden" : "inline"}`}>
                      {item.label}
                    </span>

                    {!collapsed && (
                      <ChevronDown
                        className={`ml-auto w-4 h-4 opacity-60 transform transition-transform ${stockSubmenuOpen ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </Link>

                  {!collapsed && stockSubmenuOpen && (
                    <div className="mt-1 flex flex-col gap-1 pl-7 pr-2">
                      {allowedStockTabs.includes("all") && (
                        <Link
                          to="/admin/stock?tab=all"
                          className={stockTabLinkClasses("all")}
                          onClick={() => {
                            setStockSubmenuOpen(true);
                            setPurchaseSubmenuOpen(false);
                          }}
                        >
                          <span className="truncate">All Stock</span>
                        </Link>
                      )}
                      {/* {allowedStockTabs.includes("before") && (
                        <Link
                          to="/admin/stock?tab=before"
                          className={stockTabLinkClasses("before")}
                          onClick={() => {
                            setStockSubmenuOpen(true);
                            setPurchaseSubmenuOpen(false);
                          }}
                        >
                          <span className="truncate">Reserved Stock</span>
                        </Link>
                      )} */}
                      {allowedStockTabs.includes("current") && (
                        <Link
                          to="/admin/stock?tab=current"
                          className={stockTabLinkClasses("current")}
                          onClick={() => {
                            setStockSubmenuOpen(true);
                            setPurchaseSubmenuOpen(false);
                          }}
                        >
                          <span className="truncate">Current Stock</span>
                        </Link>
                      )}
                      {/* Available / Sold Out tabs hidden
                      <Link
                        to="/admin/stock?tab=available"
                        className={stockTabLinkClasses("available")}
                        onClick={() => {
                          setStockSubmenuOpen(true);
                          setPurchaseSubmenuOpen(false);
                        }}
                      >
                        <span className="truncate">Available Stock</span>
                      </Link>
                      <Link
                        to="/admin/stock?tab=soldout"
                        className={stockTabLinkClasses("soldout")}
                        onClick={() => {
                          setStockSubmenuOpen(true);
                          setPurchaseSubmenuOpen(false);
                        }}
                      >
                        <span className="truncate">Sold Out</span>
                      </Link>
                      */}
                    </div>
                  )}
                </div>
              );
            }

            // Custom "Purchase" submenu.
            if (item.path === "/admin/purchase-history") {
              const purchaseMainPath = `/admin/purchase-history?tab=${effectivePurchaseTab}`;

              const purchaseTabLinkClasses = (tab: PurchaseTab) =>
                `flex items-center w-full transition-colors py-2 rounded-none ${collapsed
                  ? "justify-center px-0 border-l-0"
                  : "justify-start gap-3 px-3 border-l-4 border-transparent"
                } ${effectivePurchaseTab === tab
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200 border-primary-500"
                  : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                }`;

              return (
                <div key={item.path}>
                  <Link
                    to={purchaseMainPath}
                    onClick={() => {
                      setPurchaseSubmenuOpen((v) => !v);
                      setStockSubmenuOpen(false);
                    }}
                    className={`flex items-center w-full transition-colors py-2 rounded-none ${collapsed
                      ? "justify-center px-0 border-l-0"
                      : "justify-start gap-3 px-3 border-l-4 border-transparent"
                      } ${isActive
                        ? collapsed
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200"
                          : "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200 border-primary-500"
                        : collapsed
                          ? "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={`truncate ${collapsed ? "hidden" : "inline"}`}>
                      {item.label}
                    </span>

                    {!collapsed && (
                      <ChevronDown
                        className={`ml-auto w-4 h-4 opacity-60 transform transition-transform ${purchaseSubmenuOpen ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </Link>

                  {!collapsed && purchaseSubmenuOpen && (
                    <div className="mt-1 flex flex-col gap-1 pl-7 pr-2">
                      <Link
                        to="/admin/purchase-history?tab=lc_wise"
                        className={purchaseTabLinkClasses("lc_wise")}
                        onClick={() => {
                          setPurchaseSubmenuOpen(true);
                          setStockSubmenuOpen(false);
                        }}
                      >
                        <span className="truncate">LC History</span>
                      </Link>
                      <Link
                        to="/admin/purchase-history?tab=history"
                        className={purchaseTabLinkClasses("history")}
                        onClick={() => {
                          setPurchaseSubmenuOpen(true);
                          setStockSubmenuOpen(false);
                        }}
                      >
                        <span className="truncate">Purchase History</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  setStockSubmenuOpen(false);
                  setPurchaseSubmenuOpen(false);
                }}
                className={`flex items-center w-full transition-colors py-2 rounded-none ${collapsed
                  ? "justify-center px-0 border-l-0"
                  : "justify-start gap-3 px-3 border-l-4 border-transparent"
                  } ${isActive
                    ? collapsed
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200"
                      : "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-blue-200 border-primary-500"
                    : collapsed
                      ? "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className={`truncate ${collapsed ? "hidden" : "inline"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`pt-4 ${collapsed ? "hidden" : "block"
            }`}
        >
          <div className="px-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>
        </div>

        {/* Sidebar footer card image */}
        <div
          className={`pt-2 ${collapsed ? "hidden" : "block"
            }`}
        >
          <div className="p-2">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <img
                src="/sidebar-footer.png"
                alt="Sidebar footer"
                className="w-full h-28 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
