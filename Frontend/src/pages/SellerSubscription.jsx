import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, X, ArrowLeft as Back } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './Auth.css';
import './ProductDetail.css';
import './Sell.css';
import './SellerSubscription.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tag: 'Get started',
    features: [
      'Up to 5 active listings',
      'Basic in-app chat with buyers',
      'Standard placement in search',
      'Community support',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 29,
    tag: 'Most popular',
    features: [
      'Up to 50 active listings',
      'Verified seller badge after KYC',
      'Boost 3 listings per month',
      'Priority placement in your campus',
      'Email support',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    tag: 'For power sellers',
    features: [
      'Unlimited listings',
      'Featured store on home page',
      'Boost 15 listings per month',
      'Sales analytics & buyer insights',
      'Priority support (24h response)',
      'Custom store URL',
    ],
  },
];

const PAYMENT_METHODS = [
  { id: 'momo',  label: 'MTN MoMo' },
  { id: 'card',  label: 'Visa / Mastercard' },
  { id: 'bank',  label: 'Bank transfer' },
];

export default function SellerSubscription() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, subscribe, cancelSubscription } = useAuth();
  const currentPlan = user?.subscription?.plan || 'free';
  const status = user?.subscription?.status || 'free';

  const [pendingPlan, setPendingPlan] = useState(null);
  const [method, setMethod] = useState('momo');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const choosePlan = (planId) => {
    if (planId === currentPlan) return;
    if (planId === 'free') {
      onCancel();
      return;
    }
    setPendingPlan(planId);
    setErr('');
  };

  const closeCheckout = () => { setPendingPlan(null); setBusy(false); setErr(''); };

  const confirmSubscribe = async () => {
    setErr(''); setBusy(true);
    try {
      await subscribe(pendingPlan, method);
      setDone(true);
      setTimeout(() => { setDone(false); setPendingPlan(null); }, 1600);
    } catch (e) { setErr(e.message || 'Could not subscribe.'); }
    finally { setBusy(false); }
  };

  const onCancel = async () => {
    const ok = await confirm({
      title: 'Cancel subscription?',
      body: 'Your plan stays active until the end of the current billing period, then drops to Free.',
      confirmLabel: 'Cancel plan',
      danger: true,
    });
    if (!ok) return;
    await cancelSubscription();
  };

  const renewsOn = user?.subscription?.renewsOn
    ? new Date(user.subscription.renewsOn).toLocaleDateString()
    : null;

  const pendingDetails = PLANS.find((p) => p.id === pendingPlan);

  return (
    <div className="page">
      <TopBar showBack showSearch={false} title="Subscription" />

      <main className="page-main">
        <section className="sub-summary">
          <div className="sub-summary-ic"><Crown size={20} /></div>
          <div style={{ flex: 1 }}>
            <strong>
              You're on the {PLANS.find((p) => p.id === currentPlan)?.name} plan
            </strong>
            <p className="muted small">
              {status === 'active' && renewsOn && `Renews on ${renewsOn} via ${user?.subscription?.method?.toUpperCase()}`}
              {status === 'canceled' && renewsOn && `Cancels on ${renewsOn}. You will move to Free.`}
              {status === 'free' && 'Upgrade any time to unlock more listings, boosts and analytics.'}
            </p>
          </div>
        </section>

        <section className="plans-grid">
          {PLANS.map((p) => {
            const isCurrent = p.id === currentPlan;
            return (
              <article key={p.id} className={`plan-card ${p.highlight ? 'highlight' : ''} ${isCurrent ? 'current' : ''}`}>
                {p.highlight && <span className="plan-tag">Most popular</span>}
                <h3>{p.name}</h3>
                <div className="plan-price">
                  <span className="cur">GH₵</span>
                  <strong>{p.price.toLocaleString()}</strong>
                  <span className="per">{p.price === 0 ? 'forever' : '/month'}</span>
                </div>
                <p className="muted small">{p.tag}</p>
                <ul className="plan-features">
                  {p.features.map((f) => (
                    <li key={f}><Check size={14} color="#0A7E3E" /> {f}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button className="btn btn-ghost" disabled>Current plan</button>
                ) : p.id === 'free' ? (
                  <button className="btn btn-ghost" onClick={() => choosePlan(p.id)}>Downgrade to Free</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => choosePlan(p.id)}>
                    {currentPlan === 'free' ? 'Subscribe' : (currentPlan === 'pro' ? 'Switch plan' : 'Upgrade')}
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {status === 'active' && currentPlan !== 'free' && (
          <button className="btn btn-ghost danger-text" onClick={onCancel}>
            Cancel subscription
          </button>
        )}
      </main>

      {/* Checkout sheet */}
      <AnimatePresence>
        {pendingPlan && (
          <>
            <motion.div
              className="share-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCheckout}
            />
            <motion.div
              className="share-sheet sub-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <header className="share-head">
                <h3>Confirm {pendingDetails?.name} plan</h3>
                <button onClick={closeCheckout} aria-label="Close"><X size={20} /></button>
              </header>

              <div className="sub-receipt">
                <div className="row"><span>Plan</span><strong>{pendingDetails?.name}</strong></div>
                <div className="row"><span>Billing</span><strong>Monthly</strong></div>
                <div className="row total"><span>Total today</span><strong>GH₵ {Number(pendingDetails?.price || 0).toLocaleString()}</strong></div>
              </div>

              <h4 className="page-h2" style={{ marginTop: 16 }}>Payment method</h4>
              <div className="pay-methods">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id} className={`pay-method ${method === m.id ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="pay"
                      value={m.id}
                      checked={method === m.id}
                      onChange={() => setMethod(m.id)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>

              {err && <div className="auth-error">{err}</div>}

              <div className="sub-actions">
                <button className="btn btn-ghost" onClick={closeCheckout} disabled={busy}>
                  <Back size={16} /> Back
                </button>
                <button className="btn btn-primary" onClick={confirmSubscribe} disabled={busy}>
                  {busy ? 'Processing…' : `Pay GH₵ ${Number(pendingDetails?.price || 0).toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {done && (
          <motion.div
            className="success-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-card"
              initial={{ scale: 0.6 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            >
              <div className="checkmark"><Check size={36} color="#fff" /></div>
              <h3>You're subscribed!</h3>
              <p className="muted">Welcome to {pendingDetails?.name}.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
