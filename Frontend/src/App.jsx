import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './store/CartContext';
import { AuthProvider } from './store/AuthContext';
import { ConfirmProvider } from './store/ConfirmContext';
import RequireAuth from './components/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
import FloatingCart from './components/FloatingCart';
import DesktopNav from './components/DesktopNav';

import Splash          from './pages/Splash';
import Home            from './pages/Home';
import SearchPage      from './pages/Search';
import ProductDetail   from './pages/ProductDetail';
import SellerProfile   from './pages/SellerProfile';
import Cart            from './pages/Cart';
import Checkout        from './pages/Checkout';
import PaymentSuccess  from './pages/PaymentSuccess';
import Notifications   from './pages/Notifications';
import ChatList        from './pages/ChatList';
import IndividualChat  from './pages/IndividualChat';
import Sell            from './pages/Sell';
import Profile         from './pages/Profile';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import BecomeSeller    from './pages/BecomeSeller';
import SellerDashboard from './pages/SellerDashboard';
import Categories      from './pages/Categories';
import Trending        from './pages/Trending';
import AllSellers      from './pages/AllSellers';

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <DesktopNav />
            <FloatingCart />
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
              <Route path="/sellers"           element={<AllSellers />} />
              <Route path="/sellers/:id"       element={<AllSellers />} />

              {/* Auth */}
              <Route path="/login"        element={<Login />} />
              <Route path="/signup"       element={<Signup />} />

              {/* Sensitive — sign-in required */}
              <Route path="/checkout"        element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/payment-success" element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
              <Route path="/notifications"   element={<RequireAuth><Notifications /></RequireAuth>} />
              <Route path="/chats"           element={<RequireAuth><ChatList /></RequireAuth>} />
              <Route path="/chat/:id"        element={<RequireAuth><IndividualChat /></RequireAuth>} />
              <Route path="/profile"         element={<Profile />} />

              {/* Seller flow — auth + seller role */}
              <Route path="/become-seller"    element={<RequireAuth><BecomeSeller /></RequireAuth>} />
              <Route path="/sell"             element={<RequireAuth role="seller"><Sell /></RequireAuth>} />
              <Route path="/seller-dashboard" element={<RequireAuth role="seller"><SellerDashboard /></RequireAuth>} />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
