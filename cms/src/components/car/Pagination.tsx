import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  perPage?: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage = 15,
  onPageChange,
}) => {
  // Show pagination only when there are 10 or more items per page
  if (totalItems !== undefined && totalItems < perPage) return null;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-end">
      <div className="p-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (page > totalPages) return null;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-md transition-colors ${currentPage === page
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
