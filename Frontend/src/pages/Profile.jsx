import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings, LogOut, Shield, ChevronRight,
  Check, Store, Star, MapPin, Lock, Camera, Package, Truck, MessageCircle,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './Profile.css';

const INITIAL_ORDERS = [
  {
    id: 'SB-2031',
    title: 'iPad Pro 12.9"',
    sellerId: 's1',
    sellerName: 'Kofi Gadgets',
    price: 4500,
    status: 'in_escrow',
    method: 'escrow',
    placedOn: '2 May',
    eta: 'Tomorrow, by 6pm',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=70',
  },
  {
    id: 'SB-2024',
    title: 'Beats Solo 3 Wireless',
    sellerId: 's3',
    sellerName: 'Yaw Electronics',
    price: 1200,
    status: 'completed',
    method: 'meetup',
    placedOn: '12 Apr',
    eta: 'Delivered',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=70',
  },
];

const WISHLIST = [
  { id: 't2', title: 'iPhone 13 128GB', price: 3800, image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=70' },
  { id: 'r3', title: 'MacBook Pro 2019', price: 7500, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=70' },
];

const TIMELINE = [
  { key: 'placed',     label: 'Order placed',  icon: Check },
  { key: 'in_escrow',  label: 'Funds in escrow', icon: Shield },
  { key: 'shipping',   label: 'Out for delivery', icon: Truck },
  { key: 'completed',  label: 'Delivered',     icon: Package },
];

const STATUS_INDEX = { placed: 0, in_escrow: 1, shipping: 2, completed: 3 };

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, logout, updateUser } = useAuth();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [tab, setTab] = useState('orders');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewing, setReviewing]         = useState(null);
  const [draft, setDraft] = useState({ rating: 5, text: '' });

  // Settings form state — initialised lazily from current user.
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || 'University of Ghana, Legon',
    avatar: user?.avatar || '',
    password: '',
    newPassword: '',
  });

  const isGuest = !user;

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
    setOrders((os) =>
      os.map((o) => (o.id === id ? { ...o, status: 'completed' } : o))
    );
  };

  const submitReview = () => {
    if (!draft.text.trim()) return;
    // In a real app this would POST to the seller. For the mock, we just
    // mark the order as reviewed and close the modal.
    setOrders((os) =>
      os.map((o) => (o.id === reviewing.id ? { ...o, reviewed: true } : o))
    );
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

  const messageSeller = (order) => {
    // Use sellerId to open (or create) a conversation with that seller,
    // carrying the order context so the chat can display it as a banner.
    navigate(`/chat/seller-${order.sellerId}`, {
      state: {
        seller: { id: order.sellerId, name: order.sellerName },
        order: { id: order.id, title: order.title, price: order.price, image: order.image },
      },
    });
  };

  const saveSettings = (e) => {
    e.preventDefault();
    updateUser?.({
      name: settings.name,
      email: settings.email,
      location: settings.location,
      avatar: settings.avatar,
    });
    // Clear password fields after save.
    setSettings((s) => ({ ...s, password: '', newPassword: '' }));
  };

  if (isGuest) {
    return (
      <div className="page">
        <TopBar showSearch={false} title="Profile" />
        <main className="page-main">
          <div className="empty">
            <h3>You're browsing as a guest 👋</h3>
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

      <main className="page-main">
        <div className="stats-row">
          <div className="stat-card"><strong>{orders.length}</strong><span>Orders</span></div>
          <div className="stat-card"><strong>{WISHLIST.length}</strong><span>Wishlist</span></div>
        </div>

        {user.role === 'seller' && (
          <button className="card seller-banner" onClick={() => navigate('/seller-dashboard')}>
            <Store size={20} color="#0A7E3E" />
            <div style={{ flex: 1 }}>
              <strong>Seller Dashboard</strong>
              <p className="muted small">Manage listings, orders, and buyer messages</p>
            </div>
            <ChevronRight size={16} />
          </button>
        )}

        {user.role !== 'seller' && (
          <button
            className="card become-seller-cta"
            onClick={() => navigate('/become-seller')}
          >
            <Store size={20} />
            <div style={{ flex: 1 }}>
              <strong>Become a Seller</strong>
              <p className="small">Start earning on campus today</p>
            </div>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Tabs */}
        <div className="dash-tabs">
          {['orders', 'wishlist', 'settings'].map((t) => (
            <button
              key={t}
              className={`dash-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'orders' ? 'My Orders' : t === 'wishlist' ? 'Wishlist' : 'Settings'}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === 'orders' && (
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
                    #{o.id} · {o.sellerName} · {o.method === 'escrow' ? 'Escrow' : 'Meet-up'}
                  </p>
                  <span className="price">GH₵ {o.price.toLocaleString()}</span>
                </div>
                <div className="order-side">
                  <span className={`status ${o.status}`}>
                    {o.status === 'in_escrow' && 'In Escrow'}
                    {o.status === 'completed' && 'Completed'}
                    {o.status === 'shipping' && 'Shipping'}
                    {o.status === 'placed' && 'Placed'}
                  </span>
                  <button className="btn btn-ghost small" onClick={() => setTrackingOrder(o)}>
                    <Truck size={14} /> Track
                  </button>
                  <button className="btn btn-ghost small" onClick={() => messageSeller(o)}>
                    <MessageCircle size={14} /> Message seller
                  </button>
                  {o.status === 'in_escrow' && (
                    <button className="btn btn-primary" onClick={() => onConfirmReceipt(o.id)}>
                      <Check size={14} /> Confirm Receipt
                    </button>
                  )}
                  {o.status === 'completed' && !o.reviewed && (
                    <button className="btn btn-ghost" onClick={() => setReviewing(o)}>
                      <Star size={14} /> Leave Review
                    </button>
                  )}
                  {o.reviewed && <span className="muted small">✓ Reviewed</span>}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Wishlist */}
        {tab === 'wishlist' && (
          <div className="wishlist-grid">
            {WISHLIST.map((w) => (
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
            ))}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
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
        )}

        {/* Settings list */}
        <section className="link-list">
          <button className="link-row" onClick={() => setTab('settings')}><span className="link-icon"><Settings size={18} /></span><span className="link-label">Settings</span><ChevronRight size={16} className="muted" /></button>
          <button className="link-row danger" onClick={onLogout}>
            <span className="link-icon"><LogOut size={18} /></span>
            <span className="link-label">Sign Out</span>
            <ChevronRight size={16} className="muted" />
          </button>
        </section>
      </main>

      {/* Tracking modal */}
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

      {/* Review modal */}
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
