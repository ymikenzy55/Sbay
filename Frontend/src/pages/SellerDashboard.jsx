import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, MessageCircle, Package, TrendingUp, Wallet,
  ShieldCheck, ShieldAlert, Crown, Settings as SettingsIc, LogOut, ChevronRight, Store,
  ShoppingBag, Truck, Check, Star,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './Profile.css';
import './SellerDashboard.css';

const PLAN_LABEL = { free: 'Free', plus: 'Plus', pro: 'Pro' };

// Sellers can still buy on sBay. These are mocked purchases for the
// "Purchases" tab so they can track and confirm receipt like any buyer.
const INITIAL_PURCHASES = [
  {
    id: 'SB-3104',
    title: 'Logitech MX Master 3 Mouse',
    sellerId: 's2',
    sellerName: "Ama's Boutique",
    price: 780,
    status: 'in_escrow',
    method: 'escrow',
    eta: 'Tomorrow, by 6pm',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=70',
  },
  {
    id: 'SB-3088',
    title: 'Adjustable Standing Desk',
    sellerId: 's3',
    sellerName: 'Yaw Electronics',
    price: 2200,
    status: 'shipping',
    method: 'meetup',
    eta: 'Today, by 5pm',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70',
  },
  {
    id: 'SB-2980',
    title: 'Wireless Charger',
    sellerId: 's1',
    sellerName: 'Kofi Gadgets',
    price: 220,
    status: 'completed',
    method: 'escrow',
    eta: 'Delivered',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=70',
  },
];

const STATUS_LABEL = {
  placed: 'Placed',
  in_escrow: 'In Escrow',
  shipping: 'Shipping',
  completed: 'Completed',
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [listings, setListings] = useState([]);
  const [chats, setChats] = useState([]);
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);
  const [tab, setTab] = useState('listings');

  useEffect(() => {
    sbay.getRecent().then(setListings);
    sbay.getChats().then(setChats);
  }, []);

  const { logout } = useAuth();

  const onDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete this listing?',
      body: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) setListings((ls) => ls.filter((l) => l.id !== id));
  };

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      body: 'You will need to sign in again to access your seller dashboard.',
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
    setPurchases((ps) => ps.map((p) => (p.id === id ? { ...p, status: 'completed' } : p)));
  };

  const messageSeller = (order) => {
    navigate(`/chat/seller-${order.sellerId}`, {
      state: {
        seller: { id: order.sellerId, name: order.sellerName },
        order: { id: order.id, title: order.title, price: order.price, image: order.image },
      },
    });
  };

  const pendingPurchases = purchases.filter((p) => p.status !== 'completed').length;

  // Derived stats
  const totalEarnings = listings.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
  const profileViews = 247; // TODO: replace with API value
  const verificationStatus = user?.verification?.status || (user?.verified ? 'verified' : 'unverified');
  const planId = user?.subscription?.plan || 'free';

  return (
    <div className="page">
      <TopBar showBack showSearch={false} title="Seller Dashboard" />

      <main className="page-main">
        <section className="sd-hero">
          <div>
            <p className="muted">Welcome back,</p>
            <h2>{user?.sellerProfile?.storeName || user?.name || 'Seller'}</h2>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/sell')}>
            <Plus size={16} /> New Listing
          </button>
        </section>

        <section className="sd-stats">
          <div className="stat">
            <span className="ic"><Package size={18} /></span>
            <strong>{listings.length}</strong>
            <span>Active listings</span>
          </div>
          <div className="stat">
            <span className="ic"><TrendingUp size={18} /></span>
            <strong>{profileViews}</strong>
            <span>Profile views</span>
          </div>
          <div className="stat">
            <span className="ic"><Wallet size={18} /></span>
            <strong>GH₵ {totalEarnings.toLocaleString()}</strong>
            <span>Earnings</span>
          </div>
        </section>

        {/* Quick links: Verification · Subscription · Settings · Logout */}
        <section className="sd-links">
          <button
            className={`sd-link ${verificationStatus === 'verified' ? 'is-ok' : verificationStatus === 'pending' ? 'is-pending' : 'is-warn'}`}
            onClick={() => navigate('/seller/verification')}
          >
            <span className="sd-link-ic">
              {verificationStatus === 'verified' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            </span>
            <div className="sd-link-body">
              <strong>Verification</strong>
              <p className="muted small">
                {verificationStatus === 'verified' && 'Your identity is verified'}
                {verificationStatus === 'pending' && 'Under review — usually within 24h'}
                {verificationStatus === 'unverified' && 'Verify your identity to build trust'}
                {verificationStatus === 'rejected' && 'Verification was rejected — try again'}
              </p>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>

          <button className="sd-link" onClick={() => navigate('/seller/subscription')}>
            <span className="sd-link-ic"><Crown size={18} /></span>
            <div className="sd-link-body">
              <strong>Subscription</strong>
              <p className="muted small">
                Current plan: <strong>{PLAN_LABEL[planId]}</strong>
                {user?.subscription?.status === 'canceled' && ' · canceling at period end'}
              </p>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>

          <button className="sd-link" onClick={() => navigate(`/seller/${user?.id || 's1'}`)}>
            <span className="sd-link-ic"><Store size={18} /></span>
            <div className="sd-link-body">
              <strong>View public store</strong>
              <p className="muted small">See what buyers see</p>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>

          <button className="sd-link" onClick={() => navigate('/seller/settings')}>
            <span className="sd-link-ic"><SettingsIc size={18} /></span>
            <div className="sd-link-body">
              <strong>Settings</strong>
              <p className="muted small">Store, payouts, password &amp; more</p>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>

          <button className="sd-link danger" onClick={onLogout}>
            <span className="sd-link-ic"><LogOut size={18} /></span>
            <div className="sd-link-body">
              <strong>Sign out</strong>
              <p className="muted small">End this session on this device</p>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>
        </section>

        <div className="sd-tabs">
          <button className={`sd-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
            My Listings
          </button>
          <button className={`sd-tab ${tab === 'purchases' ? 'active' : ''}`} onClick={() => setTab('purchases')}>
            Purchases {pendingPurchases > 0 && <span className="badge-dot" />}
          </button>
          <button className={`sd-tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
            Buyer Messages {chats.some((c) => c.unread > 0) && <span className="badge-dot" />}
          </button>
        </div>

        {tab === 'listings' && (
          <div className="sd-listings">
            {listings.map((p, i) => (
              <motion.article
                key={p.id}
                className="sd-listing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="sd-thumb" style={{ backgroundImage: `url(${p.image})` }} />
                <div className="sd-meta">
                  <h4>{p.title}</h4>
                  <p className="muted small">{p.tag} · {p.posted}</p>
                  <span className="price">GH₵ {p.price.toLocaleString()}</span>
                </div>
                <div className="sd-actions">
                  <button className="iac" onClick={() => navigate(`/product/${p.id}`)} aria-label="View">
                    <Eye size={16} />
                  </button>
                  <button className="iac" onClick={() => navigate(`/sell?edit=${p.id}`)} aria-label="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="iac danger" onClick={() => onDelete(p.id, p.title)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.article>
            ))}
            {listings.length === 0 && (
              <div className="empty">
                <Package size={48} color="#C9D4BD" />
                <h3>No listings yet</h3>
                <p>Create your first listing to start selling.</p>
                <button className="btn btn-primary" onClick={() => navigate('/sell')}>
                  <Plus size={16} /> Create Listing
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'purchases' && (
          <div className="sd-purchases">
            <p className="muted small" style={{ marginBottom: 4 }}>
              Orders you've placed as a buyer. Track delivery, message sellers and confirm receipt here.
            </p>

            {purchases.length === 0 && (
              <div className="empty">
                <ShoppingBag size={48} color="#C9D4BD" />
                <h3>No purchases yet</h3>
                <p>Items you buy on sBay will show up here.</p>
                <button className="btn btn-primary" onClick={() => navigate('/home')}>
                  Browse marketplace
                </button>
              </div>
            )}

            {purchases.map((o) => (
              <motion.article
                key={o.id}
                className="order-card"
                initial={{ opacity: 0, y: 8 }}
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
                  <span className={`status ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <p className="muted small">{o.eta}</p>
                  <button className="btn btn-ghost small" onClick={() => messageSeller(o)}>
                    <MessageCircle size={14} /> Message seller
                  </button>
                  {o.status === 'in_escrow' && (
                    <button className="btn btn-primary" onClick={() => onConfirmReceipt(o.id)}>
                      <Check size={14} /> Confirm Receipt
                    </button>
                  )}
                  {o.status === 'shipping' && (
                    <span className="muted small"><Truck size={12} /> On the way</span>
                  )}
                  {o.status === 'completed' && (
                    <button
                      className="btn btn-ghost small"
                      onClick={() => navigate(`/product/${o.id}`)}
                    >
                      <Star size={14} /> Leave Review
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {tab === 'chats' && (
          <div className="sd-chats">
            {chats.map((c) => (
              <button key={c.id} className="chat-row" onClick={() => navigate(`/chat/${c.id}`)}>
                <div className="chat-avatar" style={{ backgroundImage: `url(${c.avatar})` }} />
                <div className="chat-info">
                  <div className="chat-row-top">
                    <h4>{c.name}</h4>
                    <span className="muted">{c.time}</span>
                  </div>
                  <p className="muted last">{c.last}</p>
                </div>
                {c.unread > 0 && <span className="unread-pulse">{c.unread}</span>}
                <MessageCircle size={18} className="muted" />
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
