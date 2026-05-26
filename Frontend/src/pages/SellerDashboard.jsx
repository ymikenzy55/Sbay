import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useSearchParams no longer needed — sub-pages handle their own state
import { motion } from 'framer-motion';
import {
  Plus, Package, TrendingUp, Wallet,
  ShieldAlert, Crown, Settings as SettingsIc, LogOut, ChevronRight, Store, Clock,
  ShoppingBag, MessageCircle,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import { productApi } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import { useOrders } from '../store/OrdersContext';
import './pages.css';
import './Profile.css';
import './SellerDashboard.css';

const PLAN_LABEL = { free: 'Free', plus: 'Plus', pro: 'Pro' };

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const [listings, setListings] = useState([]);
  const { myOrders: purchases, salesOrders } = useOrders();

  useEffect(() => {
    productApi.mine().then(setListings).catch(() => setListings([]));
  }, []);

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      body: 'You will need to sign in again to access your seller dashboard.',
      confirmLabel: 'Sign Out',
      danger: true,
    });
    if (ok) { logout(); navigate('/'); }
  };

  const totalEarnings = salesOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.total) || 0) - (Number(o.fee) || 0), 0);
  const profileViews = listings.reduce((s, l) => s + (l.views || 0), 0);
  const pendingSales = salesOrders.filter(
    (o) => !['delivered', 'completed', 'canceled'].includes(o.status)
  ).length;
  const pendingPurchases = purchases.filter((p) => p.status !== 'completed').length;
  const verificationStatus = user?.verification?.status || (user?.verified ? 'verified' : 'unverified');
  const planId = user?.subscription?.plan || 'free';
  const storeName = user?.sellerProfile?.storeName || user?.name || 'Seller';

  const NAV_CARDS = [
    {
      path: '/seller-dashboard/listings',
      icon: Package,
      label: 'My Listings',
      desc: `${listings.length} active listing${listings.length !== 1 ? 's' : ''}`,
      badge: 0,
    },
    {
      path: '/seller-dashboard/sales',
      icon: TrendingUp,
      label: 'Incoming Orders',
      desc: 'Manage & fulfil buyer orders',
      badge: pendingSales,
    },
    {
      path: '/seller-dashboard/purchases',
      icon: ShoppingBag,
      label: 'My Purchases',
      desc: 'Track items you bought',
      badge: pendingPurchases,
    },
    {
      path: '/seller-dashboard/messages',
      icon: MessageCircle,
      label: 'Buyer Messages',
      desc: 'Chat with your buyers',
      badge: 0,
    },
  ];

  return (
    <div className="page">
      <TopBar showSearch={false} title="Seller Dashboard" />

      <main className="page-main">
        {/* Hero */}
        <section className="sd-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar src={user?.avatar} name={storeName} size={48} />
            <div>
              <p className="muted" style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>Welcome back,</p>
              <h2 style={{ margin: 0 }}>{storeName}</h2>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/sell')} style={{ background: '#fff', color: 'var(--primary)' }}>
            <Plus size={16} /> New Listing
          </button>
        </section>

        {/* Stats */}
        <section className="sd-stats">
          <div className="stat">
            <span className="ic"><Package size={18} /></span>
            <strong>{listings.length}</strong>
            <span>Listings</span>
          </div>
          <div className="stat">
            <span className="ic"><TrendingUp size={18} /></span>
            <strong>{profileViews}</strong>
            <span>Views</span>
          </div>
          <div className="stat">
            <span className="ic"><Wallet size={18} /></span>
            <strong>GH₵ {totalEarnings.toLocaleString()}</strong>
            <span>Earnings</span>
          </div>
        </section>

        {/* Verification banner */}
        {verificationStatus !== 'verified' && (
          <div className={`sd-verify-banner ${verificationStatus === 'pending' ? 'is-pending' : 'is-warn'}`}>
            <span className="sd-verify-ic">
              {verificationStatus === 'pending' ? <Clock size={18} /> : <ShieldAlert size={18} />}
            </span>
            <div>
              <strong>
                {verificationStatus === 'pending' && 'Verification pending'}
                {verificationStatus === 'rejected' && 'Verification rejected'}
                {verificationStatus === 'unverified' && 'Not verified yet'}
              </strong>
              <p className="muted small">
                {verificationStatus === 'pending' && "Our admins are reviewing your application. You'll see a Verified badge once approved."}
                {verificationStatus === 'rejected' && (user?.verification?.reason || 'Please contact support to update your details.')}
                {verificationStatus === 'unverified' && 'Complete your seller registration so admins can review your account.'}
              </p>
            </div>
          </div>
        )}

        {/* Section navigation cards */}
        <h3 className="page-h2" style={{ marginTop: 8 }}>Manage</h3>
        <div className="sd-nav-grid">
          {NAV_CARDS.map(({ path, icon: Icon, label, desc, badge }) => (
            <motion.button
              key={path}
              className="sd-nav-card"
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.97 }}
            >
              <span className="sd-nav-ic"><Icon size={22} /></span>
              <div className="sd-nav-body">
                <strong>{label}</strong>
                <p className="muted small">{desc}</p>
              </div>
              {badge > 0 && <span className="sd-nav-badge">{badge}</span>}
              <ChevronRight size={16} className="muted" />
            </motion.button>
          ))}
        </div>

        {/* Account links */}
        <h3 className="page-h2" style={{ marginTop: 8 }}>Account</h3>
        <section className="sd-links">
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
      </main>

      <BottomNav />
    </div>
  );
}
