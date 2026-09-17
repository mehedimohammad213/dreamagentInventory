import React from "react";
import { Package, User, Eye, Download, Trash2, ShoppingCart, Calendar, DollarSign, Tag } from "lucide-react";
import { Order } from "../../services/orderApi";
import StockActionsDropdown from "../stock/StockActionsDropdown";

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  onView: (order: Order) => void;
  onDownloadInvoice: (order: Order) => void;
  onDelete: (order: Order) => void;
  onRefresh: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onView,
  onDownloadInvoice,
  onDelete,
  onRefresh,
  getStatusColor,
  getStatusIcon,
  formatDate,
}) => {
  const handleRowClick = (order: Order) => {
    onView(order);
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            No orders have been placed yet. Orders will appear here once
            customers start making purchases.
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="overflow-x-auto overflow-y-visible no-horizontal-scrollbar">
        <div className="min-w-[1200px]">
          {/* Clean Professional Table Header */}
          <div className="bg-gray-200 border-b border-gray-300 text-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-1">Order ID</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body matching CarTable style */}
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleRowClick(order)}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
              >
                {/* Left Side Highlight Stick */}
                <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />

                {/* Order ID */}
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                    #{order.id}
                  </span>
                </div>

                {/* Customer */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                      {order.user?.name || "Unknown User"}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {order.user_id}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="col-span-4 flex items-center">
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {order.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                      >
                        {item.car.image_url ? (
                          <img
                            src={item.car.image_url}
                            alt={`${item.car.make} ${item.car.model}`}
                            className="w-12 h-8 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {item.car.make} {item.car.model}
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="col-span-1 flex items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(order.total_amount)}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-1 flex items-center">
                  <span className="text-xs font-medium text-gray-600">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                {/* Actions — ⋮ menu */}
                <div
                  className="col-span-2 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StockActionsDropdown
                    items={[
                      {
                        id: "view",
                        label: "View",
                        icon: Eye,
                        onClick: () => onView(order),
                        variant: "primary" as const,
                      },
                      {
                        id: "invoice",
                        label: "Download invoice",
                        icon: Download,
                        onClick: () => onDownloadInvoice(order),
                        variant: "default" as const,
                        hidden: !(
                          order.status === "approved" ||
                          order.status === "shipped" ||
                          order.status === "delivered"
                        ),
                      },
                      {
                        id: "delete",
                        label: "Delete",
                        icon: Trash2,
                        onClick: () => onDelete(order),
                        variant: "danger" as const,
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
