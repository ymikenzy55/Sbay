import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Store, Star, Truck, MessageCircle, Package } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import { useOrders, ORDER_STATUSES } from '../store/OrdersContext';
import { sbay } from '../api/client';
import './pages.css';
import './Profile.css';

const STATUS_LABEL = ORDER_STATUSES.reduce((m, s) => (m[s.id] = s.label, m), {});
const TIMELINE = [
  { key: 'pending', label: 'Order placed', icon: Check },
  { key: 'processing', label: 'Seller preparing', icon: Store },
  { key: 'shipped', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
  { key: 'completed', label: 'You confirmed', icon: Star },
];

const STATUS_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3, completed: 4 };

export default function ProfileOrders() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { myOrders, confirmReceipt } = useOrders();
  const orders = myOrders;
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [draft, setDraft] = useState({ rating: 5, text: '' });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'seller') {
    return <Navigate to="/seller-dashboard" replace />;
  }

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

  const messageSeller = async (order) => {
    if (!order.sellerId || order.sellerId === 'me') return;
    try {
      const chat = await sbay.startChat(order.sellerId);
      navigate(`/chat/${chat._id}`);
    } catch (e) {
      alert(e.message || 'Could not open this chat.');
    }
  };

  return (
    <div className="page">
      <TopBar showSearch={false} title="My Orders" />
      <main className="page-main">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
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