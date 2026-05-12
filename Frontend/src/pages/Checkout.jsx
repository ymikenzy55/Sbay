import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, MapPin, Check, MessageCircle, Lock, Coffee, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import './pages.css';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user, updateUser } = useAuth();
  const [method, setMethod] = useState('escrow');
  const [location, setLocation] = useState(user?.location || '');
  const [editingLoc, setEditingLoc] = useState(!user?.location);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState('');

  const fee = method === 'escrow' ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + fee;

  const saveLocation = () => {
    const v = location.trim();
    if (!v) {
      setError('Please enter a delivery / pickup location.');
      return false;
    }
    setError('');
    updateUser?.({ location: v });
    setEditingLoc(false);
    return true;
  };

  const place = () => {
    if (editingLoc && !saveLocation()) return;
    if (!location.trim()) {
      setError('Please set a delivery / pickup location first.');
      setEditingLoc(true);
      return;
    }
    updateUser?.({ location: location.trim() });
    clear();
    navigate('/payment-success', { state: { method, total, location: location.trim() } });
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
                placeholder="e.g. University of Ghana, Night Market, Legon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoFocus
              />
              {error && <p className="co-loc-error">{error}</p>}
              <button className="btn btn-primary btn-sm" onClick={saveLocation}>
                <Check size={14} /> Save location
              </button>
            </div>
          ) : (
            <p className="co-loc-value"><MapPin size={14} /> {location}</p>
          )}
        </section>

        {/* Delivery method */}
        <section>
          <h3 className="page-h2">Choose how to get it</h3>
          <p className="muted small">You'll still be able to chat with the seller before paying.</p>

          <div className="method-grid">
            <motion.button
              type="button"
              className={`method-card ${method === 'escrow' ? 'active' : ''}`}
              onClick={() => setMethod('escrow')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="m-icon"><Lock size={22} /></div>
              <h4>Escrow Payment <span className="rec">Recommended</span></h4>
              <p>
                Pay now — sBay holds your money safely until you confirm receipt
                from your dashboard. <strong>5% service fee</strong> applies.
              </p>
              <ul className="m-list">
                <li><Check size={14} color="#0A7E3E" /> Buyer protection</li>
                <li><Check size={14} color="#0A7E3E" /> Refund if item not as described</li>
                <li><Check size={14} color="#0A7E3E" /> Seller paid only after confirmation</li>
              </ul>
              {method === 'escrow' && <span className="m-check"><Check size={16} /></span>}
            </motion.button>

            <motion.button
              type="button"
              className={`method-card ${method === 'meetup' ? 'active' : ''}`}
              onClick={() => setMethod('meetup')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="m-icon"><Coffee size={22} /></div>
              <h4>Meet-up <span className="rec ghost">No fee</span></h4>
              <p>
                Arrange a campus meet-up with the seller and pay in person on
                handover. No platform fee.
              </p>
              <ul className="m-list">
                <li><Check size={14} color="#0A7E3E" /> Inspect item before paying</li>
                <li><Check size={14} color="#0A7E3E" /> No service fee</li>
                <li><MessageCircle size={14} color="#5C6B5A" /> Coordinate via chat</li>
              </ul>
              {method === 'meetup' && <span className="m-check"><Check size={16} /></span>}
            </motion.button>
          </div>
        </section>

        {/* Totals + Review */}
        <section className="card co-totals">
          <div className="row"><span>Subtotal</span><strong>GH₵ {subtotal.toLocaleString()}</strong></div>
          <div className="row">
            <span>{method === 'escrow' ? 'Service fee (5%)' : 'Service fee'}</span>
            <strong>GH₵ {fee.toLocaleString()}</strong>
          </div>
          <div className="divider" />
          <div className="row total"><span>Total</span><strong>GH₵ {total.toLocaleString()}</strong></div>

          <button
            type="button"
            className="co-review-toggle"
            onClick={() => setReviewOpen((v) => !v)}
          >
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

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={place}>
            {method === 'escrow' ? <><Shield size={16} /> Confirm & Pay with Escrow</> : <><MapPin size={16} /> Confirm Meet-up</>}
          </button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 8 }}>
            Escrow powered by Paystack · Secured by sBay
          </p>
        </section>
      </main>
    </div>
  );
}
