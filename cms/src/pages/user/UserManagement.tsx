import React, { useState, useEffect, useCallback } from "react";
import {
  userApi,
  User,
  UsersParams,
  CreateUserPayload,
  UpdateUserPayload,
  formatUserApiError,
} from "../../services/userApi";
import { Search, Users, X, Plus, Pencil, Trash2 } from "lucide-react";
import Pagination from "../../components/car/Pagination";
import { MessageDisplay } from "../../components/category";
import UserFormModal from "../../components/user/UserFormModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import StockActionsDropdown from "../../components/stock/StockActionsDropdown";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchUsers = useCallback(
    async (params: UsersParams = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await userApi.getAllUsers({
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          ...params,
        });

        if (response.success) {
          setUsers(response.data.users);
          setTotalPages(response.data.pagination.last_page);
          setTotalItems(response.data.pagination.total);
        } else {
          setError("Failed to fetch users");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(formatUserApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, perPage, searchTerm],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 border border-red-200";
      case "user":
        return "bg-primary-100 text-primary-700 border border-primary-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const handleCreateUser = () => {
    setUserModalMode("create");
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setUserModalMode("edit");
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleUserModalClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleUserFormSubmit = async (
    data: CreateUserPayload | UpdateUserPayload,
  ) => {
    setIsSaving(true);
    try {
      if (selectedUser) {
        await userApi.updateUser(selectedUser.id, data as UpdateUserPayload);
        showMessage("success", "User updated successfully");
      } else {
        await userApi.createUser(data as CreateUserPayload);
        showMessage("success", "User created successfully");
      }
      handleUserModalClose();
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      showMessage("error", formatUserApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      showMessage("success", "User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showMessage("error", formatUserApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6 mb-6">
          {/* Header aligned with Payment page style */}
          <div className="p-0 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">
                  Users / User List
                </h1>
              </div>
            </div>
          </div>

          {/* Filters aligned with Payment page top section */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Clear Filters Button */}
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="Clear Filters"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Add Button moved here */}
            <button
              type="button"
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add user
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={() => fetchUsers()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  type="button"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "No users found matching your search"
                    : "No users found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto no-horizontal-scrollbar">
              <div className="min-w-[1100px]">
                <div className="bg-primary-100 border-b border-primary-200 text-primary-800">
                  <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider">
                    <div className="col-span-3">User Information</div>
                    <div className="col-span-2">Username</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-1">Joined</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-white hover:shadow-md hover:scale-[1.002] transition-all duration-200 group relative z-0 hover:z-10 items-center"
                    >
                      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0" />

                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                          <span className="text-white text-sm font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {u.id}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          @{u.username}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {u.email}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getRoleBadgeColor(
                            u.role,
                          )}`}
                        >
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </div>

                      <div className="col-span-1 flex items-center">
                        <span className="text-xs font-medium text-gray-600">
                          {formatDate(u.created_at)}
                        </span>
                      </div>

                      <div
                        className="col-span-2 flex items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StockActionsDropdown
                          items={[
                            {
                              id: "edit",
                              label: "Edit user",
                              icon: Pencil,
                              onClick: () => handleEditUser(u),
                              variant: "primary",
                            },
                            {
                              id: "delete",
                              label: "Delete user",
                              icon: Trash2,
                              onClick: () => handleDeleteUser(u),
                              variant: "danger",
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <UserFormModal
          isOpen={showUserModal}
          onClose={handleUserModalClose}
          title={userModalMode === "create" ? "Create user" : "Edit user"}
          user={selectedUser}
          onSubmit={handleUserFormSubmit}
          isSubmitting={isSaving}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete user"
          message={`Are you sure you want to delete "${userToDelete?.name}" (@${userToDelete?.username})? This cannot be undone.`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default UserManagement;
