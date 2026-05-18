import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, MapPin, Check, Lock, Edit3, ChevronDown, ChevronUp,
  CreditCard, Smartphone, AlertTriangle, Loader,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useOrders } from '../store/OrdersContext';
import { orderApi } from '../api/client';
import './pages.css';
import './Checkout.css';

/**
 * Escrow-only checkout.
 *
 * Per product spec, sBay no longer offers cash-on-meetup as a payment
 * path — every order is held in escrow until the buyer confirms
 * receipt. Meet-up is still possible (the seller can mark "delivered"
 * and the buyer can confirm), it's just always paid through escrow.
 *
 * On submit, the buyer's cart is sent to the backend in one request.
 * The backend will:
 *   1. Validate every line and atomically reserve stock.
 *   2. Split the cart into one Order per seller (so a single cart can
 *      span multiple sellers — each gets its own escrow record).
 *   3. Open / extend the buyer↔seller chat for each order.
 *
 * If anything fails (insufficient stock, banned listing, etc.) the
 * server rolls back, returns a 4xx, and we surface a clear message.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user, updateUser } = useAuth();
  const { addOrder, reload } = useOrders();

  const [location, setLocation] = useState(user?.location || '');
  const [editingLoc, setEditingLoc] = useState(!user?.location);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Payment method state — initialised from any saved methods on the
  // user account; otherwise blank until the user fills in details.
  // Paystack integration is out of scope for v1; the backend only
  // records cardBrand + last4 for receipts.
  const savedCard = user?.paymentMethods?.find((m) => m.method !== 'momo');
  const savedMomo = user?.paymentMethods?.find((m) => m.method === 'momo');
  const [payMethod, setPayMethod] = useState(savedMomo && !savedCard ? 'momo' : 'card');
  const [card, setCard] = useState({
    brand: savedCard?.brand || '',
    last4: savedCard?.last4 || '',
    holder: savedCard?.holder || user?.name || '',
  });
  const [momo, setMomo] = useState({
    brand: savedMomo?.brand || 'MTN MoMo',
    last4: savedMomo?.last4 || '',
    holder: savedMomo?.holder || user?.name || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Service fee is informational on this screen — the BACKEND has the
  // final say (it uses the seller's plan to decide). The 5% default
  // matches the platform-wide setting.
  const fee = Math.round(subtotal * 0.05);
  const total = subtotal + fee;

  const saveLocation = () => {
    const v = location.trim();
    if (!v) { setError('Please enter a delivery / pickup location.'); return false; }
    setError('');
    updateUser?.({ location: v });
    setEditingLoc(false);
    return true;
  };

  const place = async () => {
    if (editingLoc && !saveLocation()) return;
    if (!location.trim()) {
      setError('Please set a delivery / pickup location first.');
      setEditingLoc(true);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payment = payMethod === 'card' ? card : momo;
      const orders = await orderApi.checkout({
        items: items.map((it) => ({ productId: it._id || it.id, qty: it.qty })),
        payment: { brand: payment.brand, last4: payment.last4, holder: payment.holder },
      });
      // Update local store optimistically and refetch in the background.
      orders.forEach((o) => addOrder(o));
      reload?.();
      clear();
      // Hand off to the receipt screen with the placed orders.
      navigate('/payment-success', {
        replace: true,
        state: {
          orders,
          method: 'escrow',
          total,
          location: location.trim(),
          payment: { brand: payment.brand, last4: payment.last4 },
        },
      });
    } catch (e) {
      // Backend returns clean messages like:
      //   "Sorry — only 0 of "iPad Pro" left."
      setError(e.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page">
        <TopBar showBack title="Checkout" showSearch={false} />
        <main className="page-main">
          <div className="empty">
            <h3>Your cart is empty</h3>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar showBack title="Checkout" showSearch={false} />

      <main className="page-main">
        {/* Order Summary */}
        <section className="card">
          <h3 className="page-h2">Order Summary</h3>
          <div className="co-items">
            {items.map((it) => (
              <div key={it.id} className="co-item">
                <div className="thumb" style={{ backgroundImage: `url(${it.image})` }} />
                <div style={{ flex: 1 }}>
                  <h4>{it.title}</h4>
                  <p className="muted small">Qty {it.qty}</p>
                </div>
                <span className="price">GH₵ {(it.qty * it.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery / Pickup Location */}
        <section className="card co-location">
          <div className="co-loc-head">
            <h3 className="page-h2"><MapPin size={16} /> Delivery / Pickup Location</h3>
            {!editingLoc && location && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingLoc(true)}>
                <Edit3 size={14} /> Change
              </button>
            )}
          </div>
          {editingLoc ? (
            <div className="co-loc-edit">
              <p className="muted small">
                Where should the seller meet you or drop off? We'll save this for future orders.
              </p>
              <input
                type="text"
                className="co-loc-input"
                placeholder="e.g. UG, Night Market, Legon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={saveLocation}>
                <Check size={14} /> Save location
              </button>
            </div>
          ) : (
            <p className="co-loc-value"><MapPin size={14} /> {location}</p>
          )}
        </section>

        {/* Escrow notice (single payment path) */}
        <section className="card method-card active" style={{ cursor: 'default' }}>
          <div className="m-icon"><Lock size={22} /></div>
          <h4>Escrow Payment <span className="rec">Buyer-protected</span></h4>
          <p>
            sBay holds your money safely. The seller is paid only after you confirm
            receipt from your orders page. A <strong>5% service fee</strong> applies.
          </p>
          <ul className="m-list">
            <li><Check size={14} color="#0A7E3E" /> Buyer protection on every order</li>
            <li><Check size={14} color="#0A7E3E" /> Refund if item not as described</li>
            <li><Check size={14} color="#0A7E3E" /> Seller paid only after confirmation</li>
          </ul>
        </section>

        {/* Payment method */}
        <section className="card">
          <h3 className="page-h2">Payment method</h3>
          <div className="method-grid" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={`method-card ${payMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPayMethod('card')}
            >
              <div className="m-icon"><CreditCard size={22} /></div>
              <h4>Card</h4>
              <p className="muted small">{card.brand} ending in {card.last4}</p>
              {payMethod === 'card' && <span className="m-check"><Check size={16} /></span>}
            </button>
            <button
              type="button"
              className={`method-card ${payMethod === 'momo' ? 'active' : ''}`}
              onClick={() => setPayMethod('momo')}
            >
              <div className="m-icon"><Smartphone size={22} /></div>
              <h4>Mobile Money</h4>
              <p className="muted small">{momo.brand} ending in {momo.last4}</p>
              {payMethod === 'momo' && <span className="m-check"><Check size={16} /></span>}
            </button>
          </div>
        </section>

        {/* Totals + Review */}
        <section className="card co-totals">
          <div className="row"><span>Subtotal</span><strong>GH₵ {subtotal.toLocaleString()}</strong></div>
          <div className="row"><span>Service fee (5%)</span><strong>GH₵ {fee.toLocaleString()}</strong></div>
          <div className="divider" />
          <div className="row total"><span>Total</span><strong>GH₵ {total.toLocaleString()}</strong></div>

          <button type="button" className="co-review-toggle" onClick={() => setReviewOpen((v) => !v)}>
            {reviewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Review order & shipping location before paying
          </button>

          {reviewOpen && (
            <div className="co-review">
              <h4>Your items</h4>
              <ul className="co-review-list">
                {items.map((it) => (
                  <li key={it.id}>
                    <span>{it.title} × {it.qty}</span>
                    <strong>GH₵ {(it.qty * it.price).toLocaleString()}</strong>
                  </li>
                ))}
              </ul>
              <div className="co-review-loc">
                <div>
                  <p className="muted small">Shipping to</p>
                  <p><MapPin size={14} /> {location || 'Not set yet'}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingLoc(true)}>
                  <Edit3 size={14} /> Change location
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="co-error" role="alert">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 14 }}
            onClick={place}
            disabled={submitting}
          >
            {submitting
              ? <><Loader size={16} className="spin" /> Processing payment…</>
              : <><Shield size={16} /> Confirm & Pay GH₵ {total.toLocaleString()} with Escrow</>}
          </button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 8 }}>
            Funds held in escrow · Secured by sBay
          </p>
        </section>
      </main>
    </div>
  );
}
