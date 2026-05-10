import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Package, Settings, LogOut, Wallet, Shield, ChevronRight,
  Check, Store, MessageCircle,
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
    price: 4500,
    status: 'in_escrow',
    method: 'escrow',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=70',
  },
  {
    id: 'SB-2024',
    title: 'Beats Solo 3 Wireless',
    price: 1200,
    status: 'completed',
    method: 'meetup',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=70',
  },
];

const WISHLIST = [
  { id: 't2', title: 'iPhone 13 128GB', price: 3800, image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=70' },
  { id: 'r3', title: 'MacBook Pro 2019', price: 7500, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=70' },
];

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [tab, setTab] = useState('orders');

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
        <div className="profile-avatar" style={{ backgroundImage: `url(${user.avatar})` }} />
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}{user.role === 'seller' ? ' · Seller' : ' · Buyer'}</p>
        </div>
      </section>

      <main className="page-main">
        <div className="stats-row">
          <div className="stat-card"><strong>{orders.length}</strong><span>Orders</span></div>
          <div className="stat-card"><strong>{WISHLIST.length}</strong><span>Wishlist</span></div>
          <div className="stat-card"><strong>4.9 ★</strong><span>Buyer rating</span></div>
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

        {/* Tabs */}
        <div className="dash-tabs">
          {['orders', 'wishlist'].map((t) => (
            <button
              key={t}
              className={`dash-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'orders' ? 'My Orders' : 'Wishlist'}
            </button>
          ))}
        </div>

        {tab === 'orders' ? (
          <div className="orders-list">
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
                  <p className="muted small">#{o.id} · {o.method === 'escrow' ? 'Escrow' : 'Meet-up'}</p>
                  <span className="price">GH₵ {o.price.toLocaleString()}</span>
                </div>
                <div className="order-side">
                  <span className={`status ${o.status}`}>
                    {o.status === 'in_escrow' && 'In Escrow'}
                    {o.status === 'completed' && 'Completed'}
                  </span>
                  {o.status === 'in_escrow' && (
                    <button className="btn btn-primary" onClick={() => onConfirmReceipt(o.id)}>
                      <Check size={14} /> Confirm Receipt
                    </button>
                  )}
                  {o.status === 'completed' && (
                    <button className="btn btn-ghost" onClick={() => navigate(`/seller/s1`)}>
                      Leave Review
                    </button>
                  )}
                  <button className="btn btn-ghost small" onClick={() => navigate('/chat/c1')}>
                    <MessageCircle size={14} /> Chat
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
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

        {/* Settings list */}
        <section className="link-list">
          <button className="link-row"><span className="link-icon"><Wallet size={18} /></span><span className="link-label">Wallet</span><ChevronRight size={16} className="muted" /></button>
          <button className="link-row"><span className="link-icon"><Shield size={18} /></span><span className="link-label">Verification</span><ChevronRight size={16} className="muted" /></button>
          <button className="link-row"><span className="link-icon"><Settings size={18} /></span><span className="link-label">Settings</span><ChevronRight size={16} className="muted" /></button>
          {user.role !== 'seller' && (
            <button className="link-row" onClick={() => navigate('/become-seller')}>
              <span className="link-icon"><Store size={18} /></span>
              <span className="link-label">Become a Seller</span>
              <ChevronRight size={16} className="muted" />
            </button>
          )}
          <button className="link-row danger" onClick={onLogout}>
            <span className="link-icon"><LogOut size={18} /></span>
            <span className="link-label">Sign Out</span>
            <ChevronRight size={16} className="muted" />
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
