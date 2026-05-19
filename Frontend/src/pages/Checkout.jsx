import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, MapPin, Check, Lock, Edit3, ChevronDown, ChevronUp,
  AlertTriangle, Loader, CreditCard,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { paymentApi } from '../api/client';
import './pages.css';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const { user, updateUser } = useAuth();

  const [location, setLocation] = useState(user?.location || '');
  const [editingLoc, setEditingLoc] = useState(!user?.location);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handlePay = async () => {
    if (editingLoc && !saveLocation()) return;
    if (!location.trim()) {
      setError('Please set a delivery / pickup location first.');
      setEditingLoc(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { authorization_url } = await paymentApi.initialize({
        items: items.map((it) => ({ productId: it._id || it.id, qty: it.qty })),
        deliveryLocation: location.trim(),
      });

      window.location.href = authorization_url;
    } catch (e) {
      setError(e.message || 'Could not start payment. Please try again.');
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

        <section className="card method-card" style={{ cursor: 'default', borderColor: '#0a7e3e', background: 'var(--primary-50)' }}>
          <div className="m-icon" style={{ background: '#0a7e3e' }}><CreditCard size={22} /></div>
          <h4>Pay via Paystack</h4>
          <p className="muted small">
            Card, Mobile Money, Bank Transfer and more — all secured by Paystack.
            You'll be redirected to complete payment safely.
          </p>
        </section>

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

          <motion.button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 14 }}
            onClick={handlePay}
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
          >
            {submitting
              ? <><Loader size={16} className="spin" /> Redirecting to Paystack…</>
              : <><Shield size={16} /> Pay GH₵ {total.toLocaleString()} securely</>}
          </motion.button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 8 }}>
            Secured by Paystack · Funds held in escrow by sBay
          </p>
        </section>
      </main>
    </div>
  );
}
