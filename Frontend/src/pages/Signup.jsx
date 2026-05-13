import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, ShoppingBag, Store } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';
  const { signup } = useAuth();

  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await signup({ ...form, role });
      // Sellers go through extra onboarding before getting full seller access.
      if (role === 'seller') navigate('/become-seller', { replace: true });
      else navigate(decodeURIComponent(next), { replace: true });
    } catch (e2) { setErr(e2.message || 'Signup failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page kente-bg">
      <button className="auth-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
      <div className="auth-logo"><Logo size="lg" /></div>

      <form className="auth-card" onSubmit={submit}>
        <h2>Join sBay</h2>
        <p className="lede">Pick how you want to start.</p>

        <div className="role-grid">
          <button type="button" className={`role-card ${role === 'buyer' ? 'active' : ''}`} onClick={() => setRole('buyer')}>
            <span className="role-emo"><ShoppingBag size={22} /></span>
            <strong>Buyer</strong>
            <span>Shop campus deals</span>
          </button>
          <button type="button" className={`role-card ${role === 'seller' ? 'active' : ''}`} onClick={() => setRole('seller')}>
            <span className="role-emo"><Store size={22} /></span>
            <strong>Seller</strong>
            <span>Earn on campus</span>
          </button>
        </div>

        <div className="field">
          <label>Full name</label>
          <div className="field-input">
            <User size={16} className="lead" />
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Akwasi Mensah" required />
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <div className="field-input">
            <Mail size={16} className="lead" />
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@campus.edu.gh" required />
          </div>
        </div>

        <div className="field">
          <label>Phone (+233)</label>
          <div className="field-input">
            <Phone size={16} className="lead" />
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+233 24 000 0000" required />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field-input">
            <Lock size={16} className="lead" />
            <input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" required />
            <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label="Toggle password">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Create Account'}
        </button>

        <p className="auth-foot">
          Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
