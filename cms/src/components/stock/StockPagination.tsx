import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StockPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

const StockPagination: React.FC<StockPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}) => {
  // Show pagination only when there are 10 or more items per page
  if (totalItems !== undefined && totalItems < perPage) return null;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-primary-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                  currentPage === page
                    ? "bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 bg-gray-50 border-2 border-gray-200 hover:bg-primary-50 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-primary-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockPagination;
