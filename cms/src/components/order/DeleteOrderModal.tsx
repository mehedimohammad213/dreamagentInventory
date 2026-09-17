import React from "react";
import { Package, Trash2 } from "lucide-react";
import { Order } from "../../services/orderApi";

interface DeleteOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: number) => void;
  formatDate: (dateString: string) => string;
}

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  formatDate,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
        {/* Popup Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Delete Order</h2>
              <p className="text-red-100 text-sm">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Popup Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this order?
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""} • BDT{" "}
                    {order.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Customer: {order.user?.name || "Unknown User"}</p>
                <p>• Order placed on {formatDate(order.created_at)}</p>
                <p>
                  • Status:{" "}
                  <span className="capitalize font-medium">{order.status}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(order.id)}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
