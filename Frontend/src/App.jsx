import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './store/CartContext';
import { AuthProvider } from './store/AuthContext';
import { ConfirmProvider } from './store/ConfirmContext';
import { OrdersProvider } from './store/OrdersContext';
import RequireAuth from './components/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
import FloatingCart from './components/FloatingCart';
import DesktopNav from './components/DesktopNav';
import SupportWidget from './components/SupportWidget';
import NetworkBanner from './components/NetworkBanner';

import Splash          from './pages/Splash';
import Home            from './pages/Home';
import SearchPage      from './pages/Search';
import ProductDetail   from './pages/ProductDetail';
import SellerProfile   from './pages/SellerProfile';
import Cart            from './pages/Cart';
import Checkout        from './pages/Checkout';
import PaymentSuccess  from './pages/PaymentSuccess';
import PaymentFailed   from './pages/PaymentFailed';
import Notifications   from './pages/Notifications';
import ChatList        from './pages/ChatList';
import IndividualChat  from './pages/IndividualChat';
import Sell            from './pages/Sell';
import Profile         from './pages/Profile';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import ForgotPassword  from './pages/ForgotPassword';
import BecomeSeller    from './pages/BecomeSeller';
import SellerDashboard from './pages/SellerDashboard';
import SellerSubscription from './pages/SellerSubscription';
import SellerSettings  from './pages/SellerSettings';
import EditListing    from './pages/EditListing';
import Categories      from './pages/Categories';
import Trending        from './pages/Trending';

import { AdminProvider } from './admin/AdminContext';
import AdminLayout      from './admin/AdminLayout';
import AdminDashboard   from './admin/AdminDashboard';
import AdminUsers       from './admin/AdminUsers';
import AdminBuyers      from './admin/AdminBuyers';
import AdminSellers     from './admin/AdminSellers';
import AdminAdmins      from './admin/AdminAdmins';
import AdminSellerDetail from './admin/AdminSellerDetail';
import AdminUserDetail   from './admin/AdminUserDetail';
import AdminProducts    from './admin/AdminProducts';
import AdminOrders      from './admin/AdminOrders';
import AdminPlans       from './admin/AdminPlans';
import AdminSettings    from './admin/AdminSettings';
import AdminAudit       from './admin/AdminAudit';
import AdminChats       from './admin/AdminChats';
import AdminStudentVerification from './admin/AdminStudentVerification';
import AdminSellerVerification  from './admin/AdminSellerVerification';
import AdminSupport     from './admin/AdminSupport';

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <CartProvider>
          <OrdersProvider>
          <BrowserRouter>
            <ScrollToTop />
            <DesktopNav />
            <NetworkBanner />
            <FloatingCart />
            <SupportWidget />
            <Routes>
              {/* Public — anyone can browse */}
              <Route path="/"             element={<Splash />} />
              <Route path="/home"         element={<Home />} />
              <Route path="/search"       element={<SearchPage />} />
              <Route path="/product/:id"  element={<ProductDetail />} />
              <Route path="/seller/:id"   element={<SellerProfile />} />
              <Route path="/cart"         element={<Cart />} />

              {/* Browse by category & trending */}
              <Route path="/categories"        element={<Categories />} />
              <Route path="/category/:catId"   element={<Categories />} />
              <Route path="/trending"          element={<Trending />} />

              {/* Auth */}
              <Route path="/login"           element={<Login />} />
              <Route path="/signup"          element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Chat — sign-in required */}
              <Route path="/chats"           element={<RequireAuth><ChatList /></RequireAuth>} />
              <Route path="/chat/:id"        element={<RequireAuth><IndividualChat /></RequireAuth>} />

              {/* Sensitive — sign-in required */}
              <Route path="/checkout"        element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/payment-success" element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
              <Route path="/payment-failed"  element={<PaymentFailed />} />
              <Route path="/notifications"   element={<RequireAuth><Notifications /></RequireAuth>} />
              <Route path="/profile"         element={<Profile />} />

              {/* Seller flow — auth + seller role */}
              <Route path="/become-seller"    element={<RequireAuth><BecomeSeller /></RequireAuth>} />
              <Route path="/sell"             element={<RequireAuth role="seller"><Sell /></RequireAuth>} />
              <Route path="/seller/listing/:id/edit" element={<RequireAuth role="seller"><EditListing /></RequireAuth>} />
              <Route path="/seller-dashboard" element={<RequireAuth role="seller"><SellerDashboard /></RequireAuth>} />
              <Route path="/seller/subscription" element={<RequireAuth role="seller"><SellerSubscription /></RequireAuth>} />
              <Route path="/seller/settings"     element={<RequireAuth role="seller"><SellerSettings /></RequireAuth>} />

              {/* ---------------- Admin SPA ---------------- */}
              {/* Admins sign in via the unified /login page; role-based redirect sends them here */}
              <Route path="/admin" element={
                <AdminProvider><AdminLayout /></AdminProvider>
              }>
                <Route index           element={<AdminDashboard />} />
                <Route path="users"                     element={<AdminUsers />} />
                <Route path="users/buyers"              element={<AdminBuyers />} />
                <Route path="users/sellers"             element={<AdminSellers />} />
                <Route path="users/sellers/:id"         element={<AdminSellerDetail />} />
                <Route path="users/admins"              element={<AdminAdmins />} />
                <Route path="users/:id"                 element={<AdminUserDetail />} />
                <Route path="products"                  element={<AdminProducts />} />
                <Route path="orders"                    element={<AdminOrders />} />
                <Route path="plans"                     element={<AdminPlans />} />
                <Route path="chats"                     element={<AdminChats />} />
                <Route path="verification/students"     element={<AdminStudentVerification />} />
                <Route path="verification/sellers"      element={<AdminSellerVerification />} />
                <Route path="support"                   element={<AdminSupport />} />
                <Route path="audit"                     element={<AdminAudit />} />
                <Route path="settings"                  element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
          </OrdersProvider>
        </CartProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
