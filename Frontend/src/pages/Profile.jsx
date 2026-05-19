import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings, LogOut, ChevronRight, Check, Store, Star, MapPin, Lock, Camera,
  Package, Truck, MessageCircle, Heart,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import { useOrders, ORDER_STATUSES } from '../store/OrdersContext';
import { sbay } from '../api/client';
import './pages.css';
import './Profile.css';

const STATUS_LABEL = ORDER_STATUSES.reduce((m, s) => (m[s.id] = s.label, m), {});
const WISHLIST = [];

const TIMELINE = [
  { key: 'pending', label: 'Order placed', icon: Check },
  { key: 'processing', label: 'Seller preparing', icon: Store },
  { key: 'shipped', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
  { key: 'completed', label: 'You confirmed', icon: Star },
];

const STATUS_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3, completed: 4 };

const PROFILE_NAV = [
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'become-seller', label: 'Become a Seller', icon: Store, action: true },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'signout', label: 'Sign Out', icon: LogOut, danger: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const confirm = useConfirm();
  const { user, logout, updateUser } = useAuth();
  const { myOrders, confirmReceipt } = useOrders();
  const orders = myOrders;
  const [tab, setTab] = useState(params.get('tab') || 'orders');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [draft, setDraft] = useState({ rating: 5, text: '' });

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || 'UG, Legon',
    avatar: user?.avatar || '',
    password: '',
    newPassword: '',
  });

  const isGuest = !user;

  const wishlistCount = useMemo(() => WISHLIST.length, []);

  // Sellers manage everything from their dashboard — they should never
  // see the buyer Profile page.
  if (user?.role === 'seller') {
    return <Navigate to="/seller-dashboard" replace />;
  }

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      body: 'You will need to sign in again to chat or checkout.',
      confirmLabel: 'Sign Out',
      danger: true,
    });
    if (ok) { logout(); navigate('/'); }
  };

  const onConfirmReceipt = async (id) => {
    const ok = await confirm({
      title: 'Confirm receipt?',
      body: 'This releases the escrow funds to the seller. Only do this once you have received your item in good condition.',
      confirmLabel: 'Yes, release funds',
    });
    if (!ok) return;
    try { await confirmReceipt(id); }
    catch (e) { alert(e.message || 'Could not confirm receipt.'); }
  };

  const submitReview = () => {
    if (!draft.text.trim()) return;
    setReviewing(null);
    setDraft({ rating: 5, text: '' });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((s) => ({ ...s, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const messageSeller = async (order) => {
    if (!order.sellerId || order.sellerId === 'me') return;
    try {
      const chat = await sbay.startChat(order.sellerId);
      navigate(`/chat/${chat._id}`);
    } catch (e) {
      alert(e.message || 'Could not open this chat.');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateUser?.({
        name: settings.name,
        email: settings.email,
        location: settings.location,
        avatar: settings.avatar,
      });
      setSettings((s) => ({ ...s, password: '', newPassword: '' }));
    } catch (err) {
      alert(err.message || 'Could not save changes.');
    }
  };

  const onNavClick = async (item) => {
    if (item.id === 'signout') {
      await onLogout();
      return;
    }
    if (item.id === 'become-seller') {
      navigate('/become-seller');
      return;
    }
    setTab(item.id);
  };

  const renderOrders = () => (
    <div className="orders-list">
      {orders.length === 0 && <p className="muted">No orders yet — start browsing!</p>}
      {orders.map((o) => (
        <motion.article
          key={o.id}
          className="order-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="thumb" style={{ backgroundImage: `url(${o.image})` }} />
          <div className="order-meta">
            <h4>{o.title}</h4>
            <p className="muted small">
              {o.invoiceNumber || `#${o.id}`} · {o.sellerName} · Escrow
            </p>
            <span className="price">GH₵ {o.price.toLocaleString()}</span>
          </div>
          <div className="order-side">
            <span className={`status ${o.status}`}>
              {STATUS_LABEL[o.status] || o.status}
            </span>
            <p className="muted small">{o.eta}</p>
            <button className="btn btn-ghost small" onClick={() => setTrackingOrder(o)}>
              <Truck size={14} /> Track
            </button>
            <button className="btn btn-ghost small" onClick={() => messageSeller(o)}>
              <MessageCircle size={14} /> Message seller
            </button>
            {o.status === 'delivered' && (
              <button className="btn btn-primary" onClick={() => onConfirmReceipt(o.id)}>
                <Check size={14} /> Confirm Receipt
              </button>
            )}
            {o.status === 'completed' && !o.reviewed && (
              <button className="btn btn-ghost" onClick={() => setReviewing(o)}>
                <Star size={14} /> Leave Review
              </button>
            )}
            {o.reviewed && <span className="muted small"><Check size={12} /> Reviewed</span>}
          </div>
        </motion.article>
      ))}
    </div>
  );

  const renderWishlist = () => (
    <div className="wishlist-grid">
      {WISHLIST.length === 0 ? (
        <div className="empty">
          <Heart size={48} color="#C9D4BD" />
          <h3>No wishlist items yet</h3>
          <p className="muted">Save products you like and they’ll appear here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Browse marketplace
          </button>
        </div>
      ) : (
        WISHLIST.map((w) => (
          <article
            key={w.id}
            className="result-card"
            onClick={() => navigate(`/product/${w.id}`)}
          >
            <div className="result-img" style={{ backgroundImage: `url(${w.image})` }} />
            <div className="result-body">
              <h4 className="prod-title">{w.title}</h4>
              <span className="price">GH₵ {w.price.toLocaleString()}</span>
            </div>
          </article>
        ))
      )}
    </div>
  );

  const renderSettings = () => (
    <form className="settings-form" onSubmit={saveSettings}>
      <section className="card">
        <h3 className="page-h2">Profile picture</h3>
        <div className="avatar-row">
          <div
            className="avatar-preview"
            style={{ backgroundImage: `url(${settings.avatar || user.avatar})` }}
          />
          <label className="btn btn-ghost">
            <Camera size={16} /> Change photo
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              hidden
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h3 className="page-h2">Personal info</h3>
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </label>
        <label className="field">
          <span><MapPin size={14} /> Default pickup location</span>
          <input
            type="text"
            value={settings.location}
            onChange={(e) => setSettings({ ...settings, location: e.target.value })}
            placeholder="e.g. Night Market, UG Legon"
          />
        </label>
      </section>

      <section className="card">
        <h3 className="page-h2"><Lock size={16} /> Change password</h3>
        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            value={settings.password}
            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={settings.newPassword}
            onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
          />
        </label>
      </section>

      <button className="btn btn-primary" type="submit">
        <Check size={16} /> Save changes
      </button>
    </form>
  );

  if (isGuest) {
    return (
      <div className="page">
        <TopBar showSearch={false} title="Profile" />
        <main className="page-main">
          <div className="empty">
            <h3>You're browsing as a guest</h3>
            <p>Sign in to track orders, save items, chat, and check out.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
        <div className="profile-avatar" style={{ backgroundImage: `url(${settings.avatar || user.avatar})` }} />
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
                className={`profile-nav-row ${tab === item.id ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
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
            <div className="stat-card"><strong>{wishlistCount}</strong><span>Wishlist</span></div>
          </div>

          {tab === 'orders' && renderOrders()}
          {tab === 'wishlist' && renderWishlist()}
          {tab === 'settings' && renderSettings()}
        </section>
      </main>

      {trackingOrder && (
        <div className="sheet-overlay" onClick={() => setTrackingOrder(null)}>
          <motion.div
            className="sheet"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Track #{trackingOrder.id}</h3>
            <p className="muted small">ETA: {trackingOrder.eta}</p>
            <ul className="timeline">
              {TIMELINE.map((step, i) => {
                const reached = i <= STATUS_INDEX[trackingOrder.status];
                const Icon = step.icon;
                return (
                  <li key={step.key} className={`timeline-step ${reached ? 'done' : ''}`}>
                    <span className="timeline-icon"><Icon size={14} /></span>
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ul>
            <button className="btn btn-ghost" onClick={() => setTrackingOrder(null)}>Close</button>
          </motion.div>
        </div>
      )}

      {reviewing && (
        <div className="sheet-overlay" onClick={() => setReviewing(null)}>
          <motion.div
            className="sheet"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Review {reviewing.sellerName}</h3>
            <p className="muted small">For: {reviewing.title}</p>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="star-btn"
                  onClick={() => setDraft({ ...draft, rating: n })}
                  aria-label={`${n} star`}
                >
                  <Star
                    size={28}
                    fill={n <= draft.rating ? '#F5A623' : 'transparent'}
                    color="#F5A623"
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience with this seller..."
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              rows={4}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReview}>Submit Review</button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
