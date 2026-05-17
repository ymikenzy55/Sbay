import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Home, LayoutDashboard, Receipt, Shield, MessageCircle } from 'lucide-react';
import './pages.css';
import './PaymentSuccess.css';

/**
 * Post-checkout confirmation + lightweight receipt.
 *
 * The Checkout page hands us the freshly-created Orders, so we can
 * show invoice numbers, line items and the breakdown without an extra
 * round-trip. Buttons jump straight into the relevant chat (so the
 * buyer can coordinate handover with the seller) or to their profile
 * where the full order tracking lives.
 */
export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const orders = Array.isArray(state?.orders) ? state.orders : [];
  const total = state?.total ?? orders.reduce((s, o) => s + (o.total || 0), 0);
  const location = state?.location || '';
  const payment = state?.payment;

  useEffect(() => {
    if (!state) navigate('/home', { replace: true });
  }, [state, navigate]);

  return (
    <div className="ps-page kente-bg">
      {/* Confetti dots */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 5.5) % 100}%`,
            background: ['#0A7E3E', '#F5A623', '#D32F2F'][i % 3],
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 600, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 2.5, delay: i * 0.06, ease: 'easeIn' }}
        />
      ))}

      <motion.div
        className="ps-card"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <motion.div
          className="ps-check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.2 }}
        >
          <Check size={42} color="#fff" />
        </motion.div>
        <h2>Payment Held in Escrow</h2>
        <p className="muted">
          <Shield size={14} style={{ verticalAlign: 'text-bottom' }} />{' '}
          GH₵ {total.toLocaleString()} is held safely. Funds release to the seller
          only after you confirm receipt from your profile.
        </p>

        {/* Per-order receipts */}
        {orders.length > 0 && (
          <div className="ps-receipts">
            {orders.map((o) => (
              <div key={o._id || o.id} className="ps-receipt">
                <header>
                  <div>
                    <h4><Receipt size={14} /> Invoice {o.invoiceNumber || o.id}</h4>
                    <p className="muted small">Sold by {o.sellerName}</p>
                  </div>
                  <strong>GH₵ {(o.total || 0).toLocaleString()}</strong>
                </header>
                <ul>
                  {(o.items || []).map((it, i) => (
                    <li key={i}>
                      <span>{it.title} × {it.qty}</span>
                      <span>GH₵ {(it.price * it.qty).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="ps-receipt-meta">
                  <span>Subtotal GH₵ {(o.subtotal || 0).toLocaleString()}</span>
                  <span>Service fee ({o.feePct ?? 5}%) GH₵ {(o.fee || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(location || payment) && (
              <div className="ps-receipt-foot muted small">
                {location && <span>Deliver to: {location}</span>}
                {payment && <span>Paid with {payment.brand} ending {payment.last4}</span>}
              </div>
            )}
          </div>
        )}

        <div className="ps-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/home')}>
            <Home size={16} /> Home
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/chats')}>
            <MessageCircle size={16} /> Chat seller
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <LayoutDashboard size={16} /> Track order
          </button>
        </div>
      </motion.div>
    </div>
  );
}
