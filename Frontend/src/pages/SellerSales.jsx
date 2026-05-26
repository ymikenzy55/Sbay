import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Package, Truck } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useOrders, ORDER_STATUSES } from '../store/OrdersContext';
import { useConfirm } from '../store/ConfirmContext';
import { sbay } from '../api/client';
import './pages.css';
import './SellerDashboard.css';

const SELLER_SETTABLE = new Set(['pending', 'processing', 'shipped', 'delivered']);
const STATUS_LABEL = ORDER_STATUSES.reduce((m, s) => (m[s.id] = s.label, m), {});

export default function SellerSales() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { salesOrders, setStatus } = useOrders();

  const pending = salesOrders.filter(
    (o) => !['delivered', 'completed', 'canceled'].includes(o.status)
  ).length;

  const messageBuyer = async (order) => {
    const otherId = order.buyerId;
    if (!otherId || otherId === 'me') return;
    try {
      const chat = await sbay.startChat(otherId);
      navigate(`/chat/${chat._id}`);
    } catch (e) { alert(e.message || 'Could not open this chat.'); }
  };

  const onMarkDelivered = async (id) => {
    const ok = await confirm({
      title: 'Mark as delivered?',
      body: "Confirm you handed the item to the buyer. They'll be asked to confirm receipt to release the funds.",
      confirmLabel: 'Yes, delivered',
    });
    if (ok) setStatus(id, 'delivered');
  };

  return (
    <div className="page">
      <TopBar showBack title="Incoming Orders" showSearch={false} />
      <main className="page-main">
        <div className="sd-chats-help">
          <Package size={16} />
          <div>
            <strong>Orders you've received</strong>
            <p className="muted small">
              Update order status as you process it. Mark "Delivered" once the buyer has the item.
              {pending > 0 && <> · <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{pending} pending</span></>}
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
                disabled={!SELLER_SETTABLE.has(o.status)}
              >
                {ORDER_STATUSES
                  .filter((s) => SELLER_SETTABLE.has(s.id) || s.id === o.status)
                  .map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button className="btn btn-ghost small" onClick={() => messageBuyer(o)}>
                <MessageCircle size={14} /> Message buyer
              </button>
              {!['delivered', 'completed', 'canceled'].includes(o.status) && (
                <button className="btn btn-primary" onClick={() => onMarkDelivered(o.id)}>
                  <Truck size={14} /> Mark Delivered
                </button>
              )}
            </div>
          </motion.article>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
