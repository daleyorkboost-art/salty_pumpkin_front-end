import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Layouts
import { Layout } from "./layouts/Layout";
import { AdminLayout } from "./layouts/AdminLayout";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Tracking } from "./components/Tracking";
import { RouteSeo } from "./components/RouteSeo";

// Static Pages (import normally – they are small and used often)
import {
  About,
  Contact,
  Terms,
  Shipping,
  Privacy,
  Returns,
  Blog,
  Support,
  OrderTracking,
  Company,
  Careers,
  Brands,
  NotFound,
} from "./pages/StaticPages";

// Lazy‑loaded dynamic pages (Mapped for named exports)
const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Shop = lazy(() => import("./pages/Shop").then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then((m) => ({ default: m.ProductDetail })));
const Cart = lazy(() => import("./pages/Cart").then((m) => ({ default: m.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.Checkout })));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed").then((m) => ({ default: m.PaymentFailed })));
const OrderDetail = lazy(() => import("./pages/OrderDetail").then((m) => ({ default: m.OrderDetail })));
const Wishlist = lazy(() => import("./pages/Wishlist").then((m) => ({ default: m.Wishlist })));
const Account = lazy(() => import("./pages/Account").then((m) => ({ default: m.Account })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));

// Lazy‑loaded admin pages (Mapped for named exports)
const AdminDashboard = lazy(() => import("./admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminCustomers = lazy(() => import("./admin/AdminCustomers").then((m) => ({ default: m.AdminCustomers })));
const AdminOrders = lazy(() => import("./admin/AdminOrders").then((m) => ({ default: m.AdminOrders })));
const AdminProductForm = lazy(() => import("./admin/AdminProductForm").then((m) => ({ default: m.AdminProductForm })));
const AdminProducts = lazy(() => import("./admin/AdminProducts").then((m) => ({ default: m.AdminProducts })));
const AdminRefunds = lazy(() => import("./admin/AdminRefunds").then((m) => ({ default: m.AdminRefunds })));
const AdminReviews = lazy(() => import("./admin/AdminReviews").then((m) => ({ default: m.AdminReviews })));
const AdminSettings = lazy(() => import("./admin/AdminSettings").then((m) => ({ default: m.AdminSettings })));
const AdminTransactions = lazy(() => import("./admin/AdminTransactions").then((m) => ({ default: m.AdminTransactions })));

function RouteSkeleton() {
  return (
    <div className="route-skeleton" aria-label="Loading page">
      <span />
      <span />
      <span />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Tracking />
            <RouteSeo />
            <Suspense fallback={<RouteSkeleton />}>
              <Routes>
                <Route element={<Layout />}>
                  {/* Public routes */}
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="collections/:collection" element={<Shop />} />
                  <Route path="product-category/:category" element={<Shop />} />
                  <Route path="product-category/:group/:category" element={<Shop />} />
                  <Route path="shop/:slug" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="login" element={<Login />} />
                  <Route path="admin-login" element={<Login />} />

                  {/* Static pages */}
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="terms-and-conditions" element={<Terms />} />
                  <Route path="shipping-policy" element={<Shipping />} />
                  <Route path="shipping-delivery" element={<Shipping />} />
                  <Route path="privacy-policy" element={<Privacy />} />
                  <Route path="returns-policy" element={<Returns />} />
                  <Route path="return-policy" element={<Returns />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="support" element={<Support />} />
                  <Route path="24x7-support" element={<Support />} />
                  <Route path="order-tracking" element={<OrderTracking />} />
                  <Route path="company" element={<Company />} />
                  <Route path="careers" element={<Careers />} />
                  <Route path="brands" element={<Brands />} />

                  {/* Protected routes */}
                  <Route
                    path="checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payment-failed"
                    element={
                      <ProtectedRoute>
                        <PaymentFailed />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="order-success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="account"
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="account/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirects */}
                  <Route path="user/*" element={<Navigate to="/account" replace />} />
                  <Route path="auth/login" element={<Navigate to="/login" replace />} />
                  <Route path="auth/register" element={<Navigate to="/login" replace />} />

                  {/* Admin routes */}
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute admin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="overview" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/add" element={<AdminProductForm />} />
                    <Route path="products/:id/edit" element={<AdminProductForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="transactions" element={<AdminTransactions />} />
                    <Route path="refunds" element={<AdminRefunds />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}