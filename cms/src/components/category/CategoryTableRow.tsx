import React from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Category } from "../../services/categoryApi";

interface CategoryTableRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onView?: (category: Category) => void;
}

const CategoryTableRow: React.FC<CategoryTableRowProps> = ({
  category,
  onEdit,
  onDelete,
  onView,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 font-medium text-gray-900">#{category.id}</td>
      <td className="px-6 py-4">
        <div>
          <div className="font-semibold text-gray-900">{category.name}</div>
          {category.short_des && (
            <div className="text-sm text-gray-500 mt-1">
              {category.short_des}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {category.parent_category ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {category.parent_category.name}
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Parent
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            category.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={() => onView(category)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View Category"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-primary-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Category"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryTableRow;
