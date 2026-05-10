import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, MapPin, Check, MessageCircle, Lock, Coffee } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useCart } from '../store/CartContext';
import './pages.css';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [method, setMethod] = useState('escrow');

  const fee = method === 'escrow' ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + fee;

  const place = () => {
    clear();
    navigate('/payment-success', { state: { method, total } });
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

        {/* Totals */}
        <section className="card co-totals">
          <div className="row"><span>Subtotal</span><strong>GH₵ {subtotal.toLocaleString()}</strong></div>
          <div className="row">
            <span>{method === 'escrow' ? 'Service fee (5%)' : 'Service fee'}</span>
            <strong>GH₵ {fee.toLocaleString()}</strong>
          </div>
          <div className="divider" />
          <div className="row total"><span>Total</span><strong>GH₵ {total.toLocaleString()}</strong></div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={place}>
            {method === 'escrow' ? <><Shield size={16} /> Pay with Escrow</> : <><MapPin size={16} /> Confirm Meet-up</>}
          </button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 8 }}>
            Escrow powered by Paystack · Secured by sBay
          </p>
        </section>
      </main>
    </div>
  );
}
