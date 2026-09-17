'use client';

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrashIcon, MinusIcon, PlusIcon, ArrowLeftIcon } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderApi } from "../../services/orderApi";
import { toast } from "react-toastify";

const Cart: React.FC = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
    isLoading,
    refreshCart,
    setItems,
    isCarLoading,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { user } = useAuth();
  const browseInventoryHref =
    user?.role === "user" ? "/admin/stock?tab=current" : "/cars";

  const handleQuantityChange = async (cartId: number, newQuantity: number) => {
    // Add loading state for this specific item
    setLoadingItems((prev) => new Set(prev).add(cartId));

    try {
      if (newQuantity <= 0) {
        await removeFromCart(cartId);
      } else {
        await updateQuantity(cartId, newQuantity);
      }
    } finally {
      // Remove loading state
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartId: number) => {
    // Add loading state for this specific item
    setLoadingItems((prev) => new Set(prev).add(cartId));

    try {
      await removeFromCart(cartId);
    } finally {
      // Remove loading state
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderData = {
        shipping_address: shippingAddress || undefined,
      };

      console.log("Sending order creation request with data:", orderData);

      const response = await orderApi.createOrder(orderData);

      if (response.success) {
        toast.success(
          "🎉 Order created successfully! Your cart has been cleared."
        );
        // Refresh cart to reflect the cleared state from backend
        await refreshCart();
        navigate("/orders");
      } else {
        toast.error(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Remove full page loading - show content immediately

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Looks like you haven't added any cars to your cart yet.
          </p>
          <Link
            to={browseInventoryHref}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50000 ? 0 : 500; // Free shipping over BDT 50,000
  const total = subtotal + tax + shipping;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {item.car.make} {item.car.model} {item.car.variant}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {item.car.year} • {item.car.mileage_km?.toLocaleString()} km
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                      {item.car.category?.name || "N/A"}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                      {item.car.fuel || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    BDT {item.car.price_amount?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    per unit
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(item.id, item.quantity - 1);
                    }}
                    disabled={loadingItems.has(item.id)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingItems.has(item.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <MinusIcon className="w-4 h-4" />
                    )}
                  </button>
                  <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(item.id, item.quantity + 1);
                    }}
                    disabled={loadingItems.has(item.id)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingItems.has(item.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    BDT{" "}
                    {((item.car.price_amount || 0) * item.quantity).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                    disabled={loadingItems.has(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingItems.has(item.id) ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (8%)</span>
                <span>BDT {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `BDT ${shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>BDT {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCheckout();
                }}
                disabled={isCheckingOut}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-base font-medium"
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Order...
                  </div>
                ) : (
                  "Proceed to Checkout"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
