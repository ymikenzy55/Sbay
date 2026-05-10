import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Home, LayoutDashboard } from 'lucide-react';
import './pages.css';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const method = state?.method || 'escrow';
  const total = state?.total || 0;

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
        <h2>{method === 'escrow' ? 'Payment Held in Escrow!' : 'Meet-up Confirmed!'}</h2>
        <p className="muted">
          {method === 'escrow'
            ? `GH₵ ${total.toLocaleString()} is safely held by sBay. Funds release after you confirm receipt.`
            : 'Coordinate the meet-up with your seller via chat. Pay in person on handover.'}
        </p>
        <div className="ps-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/home')}>
            <Home size={16} /> Home
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <LayoutDashboard size={16} /> View Order
          </button>
        </div>
      </motion.div>
    </div>
  );
}
