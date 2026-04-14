import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { CartProvider } from "@/context/CartContext";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccess from "./pages/OrderSuccess";
import LoginPage from "./pages/LoginPage";
import AccountOrdersPage from "./pages/AccountOrdersPage";
import AccountProfilePage from "./pages/AccountProfilePage";
import AccountAddressesPage from "./pages/AccountAddressesPage";
import AccountPasswordPage from "./pages/AccountPasswordPage";
import AccountNotificationsPage from "./pages/AccountNotificationsPage";
import AccountVouchersPage from "./pages/AccountVouchersPage";
import AccountRewardsPage from "./pages/AccountRewardsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminItemsPage from "./pages/AdminItemsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";
import { restoreStorefrontTheme } from "@/lib/adminTheme";

const queryClient = new QueryClient();

/** Strip admin dark mode from <html> when navigating to non-admin routes. */
function StorefrontThemeSync() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    restoreStorefrontTheme();
  }, [location.pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProductsProvider>
        <CartProvider>
          <Toaster />
          <BrowserRouter>
            <StorefrontThemeSync />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/account/orders" element={<AccountOrdersPage />} />
              <Route path="/account/profile" element={<AccountProfilePage />} />
              <Route path="/account/addresses" element={<AccountAddressesPage />} />
              <Route path="/account/password" element={<AccountPasswordPage />} />
              <Route path="/account/notifications" element={<AccountNotificationsPage />} />
              <Route path="/account/vouchers" element={<AccountVouchersPage />} />
              <Route path="/account/rewards" element={<AccountRewardsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/items" element={<AdminItemsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
