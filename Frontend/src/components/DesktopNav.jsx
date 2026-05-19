import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ShoppingCart, Plus, LayoutGrid, Home as HomeIc, TrendingUp } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useUserNotifications } from '../hooks/useUserNotifications';
import './DesktopNav.css';

const LINKS = [
  { to: '/home',       label: 'Home',       icon: HomeIc },
  { to: '/categories', label: 'Categories', icon: LayoutGrid },
  { to: '/trending',   label: 'Trending',   icon: TrendingUp },
];

export default function DesktopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const { unread } = useUserNotifications();

  // Admin SPA has its own shell — never render the public marketplace nav there
  if (pathname.startsWith('/admin')) return null;

  const goSell = () => {
    if (!user) navigate('/login?mode=seller&next=' + encodeURIComponent('/become-seller'));
    else if (user.role !== 'seller') navigate('/become-seller');
    else navigate('/sell');
  };

  return (
    <header className="dnav">
      <div className="dnav-inner">
        <Link to="/home" className="dnav-brand" aria-label="sBay home">
          <Logo size="md" />
        </Link>

        <nav className="dnav-links">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `dnav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="dnav-search"
          onClick={() => navigate('/search')}
        >
          <Search size={16} />
          <span>Search campus deals...</span>
        </button>

        <div className="dnav-actions">
          <button className="dnav-sell" onClick={goSell}>
            <Plus size={16} /> Sell
          </button>
          <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
            <Bell size={20} />
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
          <button className="icon-btn" aria-label="Cart" onClick={() => navigate('/cart')}>
            <ShoppingCart size={20} />
            {count > 0 && <span className="badge">{count}</span>}
          </button>
          {user ? (
            <button
              className="avatar"
              onClick={() => navigate(user.role === 'seller' ? '/seller-dashboard' : '/profile')}
              aria-label={user.role === 'seller' ? 'Seller dashboard' : 'Profile'}
              style={{ backgroundImage: `url(${user.avatar})` }}
            />
          ) : (
            <button className="dnav-signin" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
