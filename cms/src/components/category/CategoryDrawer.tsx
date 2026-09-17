import React from "react";
import { X } from "lucide-react";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onSave?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  onSave,
  onCancel,
  showActions = true,
}) => {
  const sizeClasses = {
    sm: "h-1/3",
    md: "h-1/2",
    lg: "h-2/3",
    xl: "h-[90vh] max-h-[90vh]",
  };

  const showBottomSheetChrome = size === "xl";

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer — anchored to bottom of viewport */}
      <div
        className={`fixed inset-x-0 bottom-0 top-auto ${sizeClasses[size]} bg-white rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col pb-[env(safe-area-inset-bottom,0px)]`}
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {showBottomSheetChrome && (
          <div className="flex flex-shrink-0 justify-center pt-3 pb-1" aria-hidden>
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
        )}
        {/* Header */}
        <div
          className={`flex flex-shrink-0 items-center justify-between border-b border-gray-200 ${
            showBottomSheetChrome ? "px-6 pb-4 pt-0" : "p-6"
          }`}
        >
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content — xl bottom sheet uses overflow-hidden so children can pin footer */}
        <div
          className={`p-6 flex-1 min-h-0 ${
            showBottomSheetChrome
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          {children}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onCancel || onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryDrawer;
