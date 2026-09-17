import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const CategoryManagement = lazy(
  () => import("./pages/category/CategoryManagement"),
);
const CreateCar = lazy(() => import("./pages/car/CreateCar"));
const UpdateCar = lazy(() => import("./pages/car/UpdateCar"));
const StockManagement = lazy(() => import("./pages/stock/StockManagement"));
const UserManagement = lazy(() => import("./pages/user/UserManagement"));
const PurchaseHistory = lazy(
  () => import("./pages/purchase-history/PurchaseHistory"),
);
const PurchaseHistoryDetails = lazy(
  () => import("./pages/purchase-history/PurchaseHistoryDetails"),
);
const PurchaseHistoryEditorPage = lazy(
  () => import("./pages/purchase-history/PurchaseHistoryEditorPage"),
);
const PaymentHistory = lazy(
  () => import("./pages/payment-history/PaymentHistory"),
);
const PaymentHistoryDetails = lazy(
  () => import("./pages/payment-history/PaymentHistoryDetails"),
);
const StockGallery = lazy(() => import("./pages/stock/StockGallery"));
const ViewCar = lazy(() => import("./pages/car/ViewCar"));
const Car = lazy(() => import("./pages/car/Car"));
const Cart = lazy(() => import("./pages/cart/Cart"));
const UserOrders = lazy(() => import("./pages/order/UserOrders"));
const AdminOrders = lazy(() => import("./pages/order/AdminOrders"));
const Profile = lazy(() => import("./components/Profile"));

/** Car catalog is for guests and admins only; `user` role uses Current Stock instead. */
function CarCatalogRoute() {
  const { user } = useAuth();
  if (user?.role === "user") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Car />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                    Loading...
                  </div>
                }
              >
                <div className="min-h-screen bg-white dark:bg-gray-900">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    {/* Public stock gallery (no header layout) */}
                    <Route path="/stock-gallery/:id" element={<StockGallery />} />

                    <Route path="/" element={<HomeRedirect />} />
                    <Route element={<Layout />}>
                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute role="admin">
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/cars"
                        element={
                          <ProtectedRoute role="admin">
                            <Car />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/categories"
                        element={
                          <ProtectedRoute role="admin">
                            <CategoryManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/create-car"
                        element={
                          <ProtectedRoute role="admin">
                            <CreateCar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/update-car/:id"
                        element={
                          <ProtectedRoute role="admin">
                            <UpdateCar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/stock"
                        element={
                          <ProtectedRoute roles={["admin", "user"]}>
                            <StockManagement />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/orders"
                        element={
                          <ProtectedRoute role="admin">
                            <AdminOrders />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute role="admin">
                            <UserManagement />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/purchase-history"
                        element={
                          <ProtectedRoute role="admin">
                            <PurchaseHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/purchase-history/create"
                        element={
                          <ProtectedRoute role="admin">
                            <PurchaseHistoryEditorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/purchase-history/edit/:id"
                        element={
                          <ProtectedRoute role="admin">
                            <PurchaseHistoryEditorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/purchase-history/view/:id"
                        element={
                          <ProtectedRoute role="admin">
                            <PurchaseHistoryDetails />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/payment-history"
                        element={
                          <ProtectedRoute roles={["admin", "user"]}>
                            <PaymentHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/payment-history/view/:id"
                        element={
                          <ProtectedRoute roles={["admin", "user"]}>
                            <PaymentHistoryDetails />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/profile"
                        element={
                          <ProtectedRoute role="admin">
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* User Routes */}
                      <Route path="/car-view/:id" element={<ViewCar />} />
                      <Route path="/cars" element={<CarCatalogRoute />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute role="user">
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/user-dashboard"
                        element={
                          <ProtectedRoute role="user">
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/cart" element={<Cart />} />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute role="user">
                            <UserOrders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute role="user">
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/edit"
                        element={
                          <ProtectedRoute role="user">
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                    </Route>
                  </Routes>
                </div>
              </Suspense>
            </Router>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              className="toast-container"
              toastClassName="custom-toast"
              progressClassName="custom-toast-progress"
            />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
