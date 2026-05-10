import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login({ email, password: pw });
      navigate(decodeURIComponent(next), { replace: true });
    } catch (e2) { setErr(e2.message || 'Login failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page kente-bg">
      <button className="auth-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
      <div className="auth-logo"><Logo size="lg" /></div>

      <form className="auth-card" onSubmit={submit}>
        <h2>Welcome back 👋</h2>
        <p className="lede">Sign in to chat, checkout and manage your sBay activity.</p>

        <div className="field">
          <label>Email</label>
          <div className="field-input">
            <Mail size={16} className="lead" />
            <input type="email" placeholder="you@campus.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field-input">
            <Lock size={16} className="lead" />
            <input type={show ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label="Toggle password">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <div className="auth-meta">
          <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" /> Remember me
          </label>
          <a>Forgot password?</a>
        </div>

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="auth-foot">
          New to sBay? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
