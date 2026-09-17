import React from "react";
import { Package } from "lucide-react";

interface OrderManagementHeaderProps {
  onCreateOrder?: () => void;
}

export const OrderManagementHeader: React.FC<OrderManagementHeaderProps> = ({
  onCreateOrder,
}) => {
  return (
    <div className="p-0 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-600">
            Orders / Order List
          </h1>
        </div>
        {onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <span>Add Order</span>
          </button>
        )}
      </div>
    </div>
  );
};
