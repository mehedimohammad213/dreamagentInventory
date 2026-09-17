import React from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  X,
  User,
  Edit,
} from "lucide-react";
import { Order } from "../../services/orderApi";

interface OrderModalProps {
  order: Order | null;
  isUpdatingStatus: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: number, status: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  isUpdatingStatus,
  onClose,
  onUpdateStatus,
  getStatusIcon,
  getStatusColor,
  formatDate,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Order #{order.id}</h2>
                <p className="text-primary-100 mt-1">
                  {formatDate(order.created_at)} • {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Order Status & Quick Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-primary-100 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order Status
                      </h3>
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">
                      BDT {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Name
                        </p>
                        <p className="text-gray-900 font-medium">
                          {order.user?.name || "Unknown User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Email
                        </p>
                        <p className="text-gray-900 font-medium">
                          {order.user?.email || "No email provided"}
                        </p>
                      </div>
                    </div>
                    {order.shipping_address && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Shipping Address
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                            {order.shipping_address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Items
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="relative">
                            <img
                              src={item.car.image_url || "/placeholder-car.jpg"}
                              alt={`${item.car.make} ${item.car.model}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {item.car.make} {item.car.model}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Year: {item.car.year} • Model: {item.car.model}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                Unit Price:{" "}
                                <span className="font-medium text-gray-900">
                                  BDT {item.price.toLocaleString()}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              BDT {(item.price * item.quantity).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Subtotal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Timeline & Actions */}
              <div className="space-y-6">
                {/* Order Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Order Timeline
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order Placed
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      {order.status === "approved" && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-primary-500 rounded-full flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order Approved
                            </p>
                            <p className="text-xs text-gray-500">
                              Processing your order
                            </p>
                          </div>
                        </div>
                      )}
                      {order.status === "shipped" && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-purple-500 rounded-full flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order Shipped
                            </p>
                            <p className="text-xs text-gray-500">
                              On its way to customer
                            </p>
                          </div>
                        </div>
                      )}
                      {order.status === "delivered" && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order Delivered
                            </p>
                            <p className="text-xs text-gray-500">
                              Successfully delivered
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Admin Actions
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Status Update */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-3">
                        Update Status
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "pending",
                          "approved",
                          "shipped",
                          "delivered",
                          "canceled",
                        ].map((status) => (
                          <button
                            key={status}
                            onClick={() => onUpdateStatus(order.id, status)}
                            disabled={isUpdatingStatus}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              order.status === status
                                ? "bg-primary-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
