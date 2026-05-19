import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronRight, Store, Package, Heart } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import { useOrders } from '../store/OrdersContext';
import './pages.css';
import './Profile.css';

const PROFILE_NAV = [
  { id: 'orders', label: 'My Orders', to: '/profile/orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', to: '/profile/wishlist', icon: Heart },
  { id: 'become-seller', label: 'Become a Seller', to: '/become-seller', icon: Store, action: true },
  { id: 'settings', label: 'Settings', to: '/profile/settings', icon: Settings },
  { id: 'signout', label: 'Sign Out', icon: LogOut, danger: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, logout } = useAuth();
  const { orders } = useOrders();

  const isGuest = !user;

  if (user?.role === 'seller') {
    navigate('/seller-dashboard', { replace: true });
  }

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      body: 'You will need to sign in again to chat or checkout.',
      confirmLabel: 'Sign Out',
      danger: true,
    });
    if (ok) {
      logout();
      navigate('/');
    }
  };

  const onNavClick = async (item) => {
    if (item.id === 'signout') {
      await onLogout();
      return;
    }
    navigate(item.to);
  };

  if (isGuest) {
    return (
      <div className="page">
        <TopBar showSearch={false} title="Profile" />
        <main className="page-main">
          <div className="empty">
            <h3>You're browsing as a guest</h3>
            <p>Sign in to track orders, save items, chat, and check out.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn btn-ghost" onClick={() => navigate('/signup')}>Create Account</button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar showSearch={false} title="Dashboard" />

      <section className="profile-hero">
        <div className="profile-avatar" style={{ backgroundImage: `url(${user.avatar})` }} />
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}{user.role === 'seller' ? ' · Seller' : ' · Buyer'}</p>
        </div>
      </section>

      <main className="page-main profile-layout">
        <section className="card profile-nav-card">
          <h3 className="page-h2">Quick access</h3>
          <div className="profile-nav-list">
            {PROFILE_NAV.map((item) => (
              <button
                key={item.id}
                className={`profile-nav-row ${item.danger ? 'danger' : ''}`}
                onClick={() => onNavClick(item)}
                type="button"
              >
                <span className="profile-nav-icon"><item.icon size={18} /></span>
                <span className="profile-nav-label">{item.label}</span>
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>
        </section>

        <section className="profile-content">
          <div className="stats-row">
            <div className="stat-card"><strong>{orders.length}</strong><span>Orders</span></div>
            <div className="stat-card"><strong>{0}</strong><span>Wishlist</span></div>
          </div>

          <section className="card">
            <h3 className="page-h2">Dashboard overview</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Use the quick access menu to open your orders, wishlist, settings, or seller registration in a new page.
            </p>
          </section>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
