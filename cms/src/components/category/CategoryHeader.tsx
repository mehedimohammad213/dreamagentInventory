import React from "react";
import { Plus } from "lucide-react";

interface CategoryHeaderProps {
  onCreateCategory: () => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  onCreateCategory,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Category Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your vehicle categories
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onCreateCategory}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryHeader;
