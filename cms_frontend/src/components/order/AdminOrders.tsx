'use client';

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { orderApi, Order } from "../../services/orderApi";
import { InvoiceService } from "../../services/invoiceService";
import { toast } from "react-toastify";
import Pagination from "../../components/common/Pagination";
import {
  OrderManagementHeader,
  OrderFilters,
  OrderTable,
  OrderModal,
  DeleteOrderModal,
} from "../../components/order";

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getAllOrders();
      if (response.success) {
        setOrders(response.data?.orders || []);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await orderApi.updateOrderStatus(orderId, {
        status: newStatus as any,
      });
      if (response.success) {
        toast.success("Order status updated successfully");
        loadOrders();
        setSelectedOrder(null);
      } else {
        toast.error(response.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await orderApi.deleteOrder(orderId);
      if (response.success) {
        toast.success("Order deleted successfully");
        loadOrders();
        setSelectedOrder(null);
        setShowDeletePopup(false);
        setOrderToDelete(null);
      } else {
        toast.error(response.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const openDeletePopup = (order: Order) => {
    setOrderToDelete(order);
    setShowDeletePopup(true);
  };

  const closeDeletePopup = () => {
    setShowDeletePopup(false);
    setOrderToDelete(null);
  };

  const handleDownloadInvoice = (order: Order) => {
    try {
      InvoiceService.generateInvoice(order);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-primary-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "canceled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-primary-100 text-primary-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      order.id.toString().includes(searchTerm) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(order.created_at);
      const filterDate = new Date(dateFilter);
      matchesDate = orderDate.toDateString() === filterDate.toDateString();
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto px-4 pb-6">
        <OrderManagementHeader />

        <OrderFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onDateFilterChange={setDateFilter}
          onClearFilters={() => {
            setDateFilter("");
            setSearchTerm("");
            setStatusFilter("all");
          }}
        />

        <OrderTable
          orders={paginatedOrders}
          isLoading={loading}
          onView={setSelectedOrder}
          onDownloadInvoice={handleDownloadInvoice}
          onDelete={openDeletePopup}
          onRefresh={loadOrders}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          formatDate={formatDate}
        />

        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Order Modal */}
        <OrderModal
          order={selectedOrder}
          isUpdatingStatus={isUpdatingStatus}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          formatDate={formatDate}
        />

        {/* Delete Order Modal */}
        <DeleteOrderModal
          order={orderToDelete}
          isOpen={showDeletePopup}
          onClose={closeDeletePopup}
          onConfirm={handleDeleteOrder}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default AdminOrders;
