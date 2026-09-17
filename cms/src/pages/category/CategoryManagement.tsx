import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import {
  categoryApi,
  Category,
  CreateCategoryData,
} from "../../services/categoryApi";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import {
  CategoryHeader,
  CategoryFilters,
  CategoryTable,
  CategoryPagination,
  MessageDisplay,
  CategoryDrawer,
  CategoryDrawerForm,
} from "../../components/category";

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Drawer states
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Success/Error messages
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);

      // Test backend connection
      try {
        const testResponse = await axios.get(API_ENDPOINTS.CATEGORIES.BASE, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        if (testResponse.status !== 200) {
          throw new Error(`Backend not accessible: ${testResponse.status}`);
        }
      } catch (testError) {
        showMessage(
          "error",
          `Cannot connect to backend server: ${
            testError instanceof Error ? testError.message : "Unknown error"
          }`
        );
        setCategories([]);
        setIsLoading(false);
        return;
      }

      const response = await categoryApi.getCategories({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: perPage,
        page: currentPage,
      });

      if (response.success && response.data.categories) {
        setCategories(response.data.categories);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.last_page);
          setTotalItems(response.data.pagination.total);
        }
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showMessage("error", "Failed to fetch categories");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setDrawerMode("create");
    setShowDrawer(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setDrawerMode("edit");
    setShowDrawer(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await categoryApi.deleteCategory(categoryToDelete.id);
      setCategories(categories.filter((cat) => cat.id !== categoryToDelete.id));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      showMessage("success", "Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      showMessage("error", "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrawerSubmit = async (data: CreateCategoryData) => {
    try {
      if (selectedCategory) {
        await categoryApi.updateCategory({ id: selectedCategory.id, ...data });
        showMessage("success", "Category updated successfully");
      } else {
        await categoryApi.createCategory(data);
        showMessage("success", "Category created successfully");
      }
      setShowDrawer(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      showMessage(
        "error",
        selectedCategory
          ? "Failed to update category"
          : "Failed to create category"
      );
    }
  };

  const handleDrawerClose = () => {
    setShowDrawer(false);
    setSelectedCategory(null);
  };

  const handleDrawerEdit = () => {
    if (selectedCategory) {
      setDrawerMode("edit");
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <CategoryHeader onCreateCategory={handleCreateCategory} />

      <MessageDisplay message={message} />

      <CategoryFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onClearFilters={handleClearFilters}
      />

      <CategoryTable
        categories={categories}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onRefresh={fetchCategories}
      />

      <CategoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setCurrentPage}
      />

      <CategoryDrawer
        isOpen={showDrawer}
        onClose={handleDrawerClose}
        title={
          drawerMode === "create" ? "Create New Category" : "Edit Category"
        }
        size="md"
        showActions={false}
      >
        <CategoryDrawerForm
          category={selectedCategory}
          onSubmit={handleDrawerSubmit}
          onCancel={handleDrawerClose}
          isLoading={false}
        />
      </CategoryDrawer>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CategoryManagement;
