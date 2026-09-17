import React, { useState, useEffect, useRef } from "react";
import { Category, CreateCategoryData } from "../../services/categoryApi";
import { Upload, X } from "lucide-react";

interface CategoryDrawerFormProps {
  category?: Category | null;
  onSubmit: (data: CreateCategoryData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CategoryDrawerForm: React.FC<CategoryDrawerFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "",
    description: "",
    type: "",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.short_des || "",
        type: "",
        status: category.status,
      });
      if (category.image) {
        setImagePreview(category.image);
      }
    } else {
      // Clear form when creating new category
      setFormData({
        name: "",
        description: "",
        type: "",
        status: "active",
      });
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: CreateCategoryData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev: CreateCategoryData) => ({ ...prev, image: "" })); // Clear URL when file is selected

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for submission
    const submitData = { ...formData };

    // If a file is selected, use the file instead of URL
    if (selectedFile) {
      submitData.image = selectedFile;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name and Status Fields - 2 Columns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter category name"
          />
        </div>

        {/* <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Type
          </label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter category type"
          />
        </div> */}

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter category description"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        >
          {isLoading
            ? "Saving..."
            : category
            ? "Update Category"
            : "Create Category"}
        </button>
      </div>

      {/* Image Upload Section - COMMENTED OUT */}
      {/* <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Upload Image File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Choose Image File
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 flex justify-center items-start">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No image selected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div> */}
    </form>
  );
};

export default CategoryDrawerForm;
