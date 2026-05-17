import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, MessageCircle, Package, TrendingUp, Wallet,
  ShieldAlert, Crown, Settings as SettingsIc, LogOut, ChevronRight, Store, Clock,
  ShoppingBag, Truck, Check, Star,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay, productApi } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import { useOrders, ORDER_STATUSES } from '../store/OrdersContext';
import './pages.css';
import './Profile.css';
import './SellerDashboard.css';

// Sellers may only set their orders to these states from the dashboard.
// `completed` happens automatically when the buyer confirms receipt;
// `canceled` goes through the dedicated cancel button.
const SELLER_SETTABLE_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered']);

const PLAN_LABEL = { free: 'Free', plus: 'Plus', pro: 'Pro' };

const STATUS_LABEL = ORDER_STATUSES.reduce((m, s) => (m[s.id] = s.label, m), {});

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [listings, setListings] = useState([]);
  const [chats, setChats] = useState([]);
  const { myOrders: purchases, salesOrders, setStatus, confirmReceipt } = useOrders();
  const [tab, setTab] = useState('listings');
  const [listingCat, setListingCat] = useState('all');

  useEffect(() => {
    // Only the signed-in seller's own listings — not the platform-wide feed.
    productApi.mine().then(setListings).catch(() => setListings([]));
    sbay.getSellerChats().then(setChats).catch(() => setChats([]));
  }, []);

  const { logout } = useAuth();

  const onDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete this listing?',
      body: `"${title}" will be hidden from the marketplace. Existing orders are unaffected.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await productApi.remove(id);
      setListings((ls) => ls.filter((l) => l.id !== id));
    } catch (e) {
      // Backend already records the reason; just put the item back so
      // the user knows nothing happened.
      alert(e.message || 'Could not delete this listing.');
    }
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
    try { await confirmReceipt(id); }
    catch (e) { alert(e.message || 'Could not confirm receipt.'); }
  };

  const onMarkDelivered = async (id) => {
    const ok = await confirm({
      title: 'Mark as delivered?',
      body: 'Confirm you handed the item to the buyer. They\'ll be asked to confirm receipt to release the funds.',
      confirmLabel: 'Yes, delivered',
    });
    if (!ok) return;
    setStatus(id, 'delivered');
  };

  const pendingSales = salesOrders.filter(
    (o) => !['delivered', 'completed', 'canceled'].includes(o.status)
  ).length;

  // Open / re-open the chat thread for an order. `startChat` is
  // idempotent on the backend — it returns the existing thread if
  // there's already one with this seller.
  const openChatForOrder = async (order, role) => {
    const otherId = role === 'seller' ? order.buyerId : order.sellerId;
    if (!otherId || otherId === 'me') return;
    try {
      const chat = await sbay.startChat(otherId);
      navigate(`/chat/${chat._id}`);
    } catch (e) {
      alert(e.message || 'Could not open this chat.');
    }
  };
  const messageSeller = (order) => openChatForOrder(order, 'buyer');
  const messageBuyer  = (order) => openChatForOrder(order, 'seller');

  const pendingPurchases = purchases.filter((p) => p.status !== 'completed').length;

  // Derived stats — earnings reflect *actual* released escrow from
  // completed sales, not the catalogue value. Listings are an inventory
  // count.
  const totalEarnings = salesOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.total) || 0) - (Number(o.fee) || 0), 0);
  const profileViews = listings.reduce((s, l) => s + (l.views || 0), 0);
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

        {/* Verification banner — read-only. Admins approve from the admin panel. */}
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
                {verificationStatus === 'pending' && 'Our admins are reviewing your application. You\'ll see a Verified badge once approved.'}
                {verificationStatus === 'rejected' && (user?.verification?.reason || 'Please contact support to update your details.')}
                {verificationStatus === 'unverified' && 'Complete your seller registration so admins can review your account.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick links: Subscription · Store · Settings · Logout */}
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

        <div className="sd-tabs">
          <button className={`sd-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
            Listings
          </button>
          <button className={`sd-tab ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>
            Orders {pendingSales > 0 && <span className="badge-dot" />}
          </button>
          <button className={`sd-tab ${tab === 'purchases' ? 'active' : ''}`} onClick={() => setTab('purchases')}>
            Purchases
          </button>
          <button className={`sd-tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
            Messages {chats.some((c) => c.unread > 0) && <span className="badge-dot" />}
          </button>
        </div>

        {tab === 'listings' && (() => {
          // Build the set of categories actually present in the seller's
          // listings, plus an "All" pill that resets the filter.
          const cats = ['all', ...new Set(listings.map((l) => l.categoryId).filter(Boolean))];
          const visible = listings.filter((l) =>
            listingCat === 'all' ? true : l.categoryId === listingCat
          );
          return (
            <div className="sd-listings">
              {cats.length > 1 && (
                <div className="sd-listing-filter">
                  {cats.map((c) => (
                    <button
                      key={c}
                      className={`sd-filter-pill ${listingCat === c ? 'active' : ''}`}
                      onClick={() => setListingCat(c)}
                    >
                      {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              {visible.map((p, i) => (
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
                  <p className="muted small">
                    {p.tag || p.condition} · {p.stock ?? 0} in stock
                    {p.status && p.status !== 'active' && ` · ${p.status}`}
                  </p>
                  <span className="price">GH₵ {p.price.toLocaleString()}</span>
                </div>
                <div className="sd-actions">
                  <button className="iac" onClick={() => navigate(`/product/${p.id}`)} aria-label="View">
                    <Eye size={16} />
                  </button>
                  <button className="iac" onClick={() => navigate(`/seller/listing/${p.id}/edit`)} aria-label="Edit">
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
              {listings.length > 0 && visible.length === 0 && (
                <div className="empty">
                  <Package size={48} color="#C9D4BD" />
                  <h3>No listings in this category</h3>
                  <p>Try a different category, or tap "All" to see everything.</p>
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'sales' && (
          <div className="sd-purchases">
            <div className="sd-chats-help">
              <Package size={16} />
              <div>
                <strong>Orders you've received</strong>
                <p className="muted small">
                  Update the order status as you process it. Buyers see status changes
                  in real time. Mark "Delivered" once the buyer has the item.
                </p>
              </div>
            </div>

            {salesOrders.length === 0 && (
              <div className="empty">
                <Package size={48} color="#C9D4BD" />
                <h3>No incoming orders</h3>
                <p>New buyer orders will appear here so you can fulfil them.</p>
              </div>
            )}

            {salesOrders.map((o) => (
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
                    {o.invoiceNumber || `#${o.id}`} · {o.buyerName} · Escrow
                  </p>
                  <p className="muted small">📍 {o.buyerLocation || o.deliveryLocation || '—'}</p>
                  <span className="price">GH₵ {o.price.toLocaleString()}</span>
                </div>
                <div className="order-side">
                  <span className={`status ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    disabled={!SELLER_SETTABLE_STATUSES.has(o.status)}
                  >
                    {ORDER_STATUSES
                      .filter((s) => SELLER_SETTABLE_STATUSES.has(s.id) || s.id === o.status)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                  </select>
                  <button
                    className="btn btn-ghost small"
                    onClick={() => messageBuyer(o)}
                  >
                    <MessageCircle size={14} /> Message buyer
                  </button>
                  {o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'canceled' && (
                    <button className="btn btn-primary" onClick={() => onMarkDelivered(o.id)}>
                      <Truck size={14} /> Mark Delivered
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
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
                    {o.invoiceNumber || `#${o.id}`} · {o.sellerName} · Escrow
                  </p>
                  <span className="price">GH₵ {o.price.toLocaleString()}</span>
                </div>
                <div className="order-side">
                  <span className={`status ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <p className="muted small">{o.eta}</p>
                  <button className="btn btn-ghost small" onClick={() => messageSeller(o)}>
                    <MessageCircle size={14} /> Message seller
                  </button>
                  {o.status === 'delivered' && (
                    <button className="btn btn-primary" onClick={() => onConfirmReceipt(o.id)}>
                      <Check size={14} /> Confirm Receipt
                    </button>
                  )}
                  {o.status === 'shipped' && (
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
            <div className="sd-chats-help">
              <MessageCircle size={16} />
              <div>
                <strong>Buyer messages</strong>
                <p className="muted small">
                  Tap a chat to reply. Each card shows the buyer, their campus and the
                  exact item they're enquiring about.
                </p>
              </div>
            </div>

            {chats.length === 0 && (
              <div className="empty">
                <MessageCircle size={48} color="#C9D4BD" />
                <h3>No buyer messages yet</h3>
                <p>When buyers message you about your listings, they'll appear here.</p>
              </div>
            )}

            {chats.map((c) => (
              <button
                key={c.id}
                className="sd-chat-row"
                onClick={() => navigate(`/chat/${c.id}`)}
              >
                <div className="sd-chat-avatar" style={{ backgroundImage: `url(${c.avatar})` }} />
                <div className="sd-chat-body">
                  <div className="sd-chat-top">
                    <h4>{c.buyerName || c.name}</h4>
                    <span className="muted small">{c.time}</span>
                  </div>
                  {c.buyerLocation && (
                    <p className="sd-chat-loc muted small">📍 {c.buyerLocation}</p>
                  )}
                  {c.productTitle && (
                    <div className="sd-chat-item">
                      {c.productImage && (
                        <span
                          className="sd-chat-item-img"
                          style={{ backgroundImage: `url(${c.productImage})` }}
                        />
                      )}
                      <span className="sd-chat-item-title">Re: {c.productTitle}</span>
                    </div>
                  )}
                  <p className="sd-chat-last">{c.last}</p>
                </div>
                {c.unread > 0 && <span className="unread-pulse">{c.unread}</span>}
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
