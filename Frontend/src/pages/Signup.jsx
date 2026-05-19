import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, ShoppingBag, Store, Check, X } from 'lucide-react';
import Logo from '../components/Logo';
import OAuthButtons from '../components/OAuthButtons';
import { useAuth } from '../store/AuthContext';
import './Auth.css';

/**
 * Score password strength based on length + variety. Returns:
 *   { score: 0..4, label, color, checks }
 */
function scorePassword(pw) {
  const checks = {
    length:    pw.length >= 8,
    lengthOk:  pw.length >= 12,
    upper:     /[A-Z]/.test(pw),
    lower:     /[a-z]/.test(pw),
    digit:     /[0-9]/.test(pw),
    symbol:    /[^A-Za-z0-9]/.test(pw),
  };
  let score = 0;
  if (checks.length) score++;
  if (checks.upper && checks.lower) score++;
  if (checks.digit) score++;
  if (checks.symbol) score++;
  if (checks.lengthOk && score >= 3) score = 4;
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['#c0392b', '#e67e22', '#f1c40f', '#0a7e3e', '#065f2e'];
  return { score, label: labels[score], color: colors[score], checks };
}

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';
  const sellerOnly = params.get('mode') === 'seller';
  const { signup } = useAuth();

  const [role, setRole] = useState(sellerOnly ? 'seller' : 'buyer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const strength = useMemo(() => scorePassword(form.password), [form.password]);
  const passwordsMatch = form.password && form.password === form.confirmPassword;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (strength.score < 2) {
      setErr('Please choose a stronger password (mix of letters, numbers, symbols).');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...payload } = form;
      await signup({ ...payload, role });
      // Sellers go through extra onboarding before getting full seller access.
      if (role === 'seller') navigate('/become-seller', { replace: true });
      else navigate(decodeURIComponent(next), { replace: true });
    } catch (e2) { setErr(e2.message || 'Signup failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page kente-bg">
      <button className="auth-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
      <div className="auth-logo">
        <Logo size="lg" />
        <p className="auth-tagline">Buy &amp; sell, the smart campus way.</p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <h2>Join sBay</h2>
        <p className="lede">{sellerOnly ? 'Create your seller account to continue.' : 'Pick how you want to start.'}</p>

        {!sellerOnly && <div className="role-grid">
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
        </div>}

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
          <label>Phone number</label>
          <div className="field-input">
            <Phone size={16} className="lead" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
              placeholder="number"
              required
            />
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

          {/* Strength meter */}
          {form.password && (
            <div className="pw-strength" aria-live="polite">
              <div className="pw-bar">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="pw-seg"
                    style={{ background: i < strength.score ? strength.color : '#e6e9e3' }}
                  />
                ))}
              </div>
              <small style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</small>
              <ul className="pw-checks">
                <li className={strength.checks.length ? 'ok' : ''}>
                  {strength.checks.length ? <Check size={12} /> : <X size={12} />} 8+ characters
                </li>
                <li className={strength.checks.upper && strength.checks.lower ? 'ok' : ''}>
                  {strength.checks.upper && strength.checks.lower ? <Check size={12} /> : <X size={12} />} Mixed case
                </li>
                <li className={strength.checks.digit ? 'ok' : ''}>
                  {strength.checks.digit ? <Check size={12} /> : <X size={12} />} Number
                </li>
                <li className={strength.checks.symbol ? 'ok' : ''}>
                  {strength.checks.symbol ? <Check size={12} /> : <X size={12} />} Symbol
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="field">
          <label>Confirm password</label>
          <div className="field-input">
            <Lock size={16} className="lead" />
            <input
              type={show ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>
          {form.confirmPassword && (
            <small style={{ color: passwordsMatch ? '#0a7e3e' : '#c0392b', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              {passwordsMatch ? <><Check size={12} /> Passwords match</> : <><X size={12} /> Passwords do not match</>}
            </small>
          )}
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Create Account'}
        </button>

        <OAuthButtons />

        <p className="auth-foot">
          Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
