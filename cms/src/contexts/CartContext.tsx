import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-toastify";
import { Car } from "../services/carApi";
import { cartApi, CartItem as ApiCartItem } from "../services/cartApi";
import { useAuth } from "./AuthContext";

interface CartItem {
  id: number; // Cart item ID from API
  car: Car;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  loadingCars: Set<number>; // Track which cars are being added to cart
  addToCart: (car: Car, quantity?: number) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  updateQuantity: (cartId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  refreshCart: () => Promise<void>;
  setItems: (items: CartItem[]) => void;
  isCarLoading: (carId: number | string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCars, setLoadingCars] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  // Toast notification functions
  const showSuccessToast = (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showErrorToast = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showInfoToast = (message: string) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Convert API cart item to local cart item format
  const convertApiCartItem = (apiItem: ApiCartItem): CartItem => {
    return {
      id: apiItem.id, // Store the cart item ID
      car: apiItem.car as any, // Use the car object as-is from the API
      quantity: apiItem.quantity,
    };
  };

  // Load cart from API when user is authenticated
  const loadCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.getCartItems();
      if (response && response.success) {
        const convertedItems = response.data.items.map(convertApiCartItem);
        setItems(convertedItems);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      // Don't show error to user on initial load, just log it
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const addToCart = async (car: Car, quantity: number = 1) => {
    if (!user) {
      showErrorToast("Please log in to add items to your cart");
      return;
    }

    // Add car to loading set
    setLoadingCars((prev) => new Set(prev).add(car.id));

    try {
      setIsLoading(true);
      const response = await cartApi.addToCart({
        car_id: car.id,
        quantity,
      });

      if (response.success) {
        showSuccessToast(
          `🚗 ${car.make} ${car.model} added to cart successfully!`
        );
        // Reload cart to get updated data
        await loadCart();
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      showErrorToast("Failed to add item to cart. Please try again.");
    } finally {
      setIsLoading(false);
      // Remove car from loading set
      setLoadingCars((prev) => {
        const newSet = new Set(prev);
        newSet.delete(car.id);
        return newSet;
      });
    }
  };

  const removeFromCart = async (cartId: number) => {
    if (!user) {
      console.error("User must be logged in to remove items from cart");
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.removeFromCart(cartId);

      if (response.success) {
        showInfoToast("Item removed from cart");
        // Reload cart to get updated data
        await loadCart();
      }
    } catch (error) {
      console.error("Failed to remove item from cart:", error);
      showErrorToast("Failed to remove item from cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, quantity: number) => {
    if (!user) {
      console.error("User must be logged in to update cart");
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(cartId);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.updateCartItem(cartId, { quantity });

      if (response.success) {
        // Reload cart to get updated data
        await loadCart();
      }
    } catch (error) {
      console.error("Failed to update cart item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) {
      console.error("User must be logged in to clear cart");
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.clearCart();

      if (response.success) {
        showInfoToast("Cart cleared successfully");
        setItems([]);
      } else {
        // If API call fails, still clear local state
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Even if API call fails, clear local state
      setItems([]);
      const status = (error as any)?.response?.status as number | undefined;
      // During logout, cart endpoints may legitimately fail (logged out / route mismatch).
      // In those cases we keep the UX clean and skip the toast.
      if (status !== 401 && status !== 403 && status !== 404) {
        showErrorToast("Failed to clear cart");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + (item.car.price_amount || 0) * item.quantity,
      0
    );
  };

  const isCarLoading = (carId: number | string) => {
    const numericId = typeof carId === "string" ? Number(carId) : carId;
    return loadingCars.has(numericId);
  };

  const value = {
    items,
    isLoading,
    loadingCars,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    refreshCart,
    setItems,
    isCarLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
