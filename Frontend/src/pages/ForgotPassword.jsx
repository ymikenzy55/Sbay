import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const emailFromLink = params.get('email') || '';
  const { requestPasswordReset, resetPassword } = useAuth();

  const [email, setEmail] = useState(emailFromLink);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [done, setDone] = useState(false);

  const sendLink = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setDevLink(res.resetUrl || '');
      setSent(true);
    } catch (e2) {
      setErr(e2.message || 'Could not send reset link.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw !== pw2) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), token, newPassword: pw });
      setDone(true);
    } catch (e2) {
      setErr(e2.message || 'Could not reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page kente-bg">
      <button className="auth-back" onClick={() => navigate(-1)} aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <div className="auth-logo"><Logo size="lg" /></div>

      {!token && (
        <form className="auth-card" onSubmit={sendLink}>
          <h2>Forgot password</h2>
          <p className="lede">Enter the Gmail you registered with. We'll send a secure reset link.</p>

          <div className="field">
            <label>Gmail</label>
            <div className="field-input">
              <Mail size={16} className="lead" />
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {err && <div className="auth-error">{err}</div>}
          {sent && (
            <div className="auth-hint">
              Check your Gmail for the reset link.
              {devLink && <><br /><a href={devLink}>Open development reset link</a></>}
            </div>
          )}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>

          <p className="auth-foot">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}

      {token && !done && (
        <form className="auth-card" onSubmit={savePassword}>
          <h2>Set new password</h2>
          <p className="lede">Create and confirm a new password for {email || 'your account'}.</p>

          <div className="field">
            <label>New password</label>
            <div className="field-input">
              <Lock size={16} className="lead" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
              <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label="Toggle password">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Confirm new password</label>
            <div className="field-input">
              <Lock size={16} className="lead" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}

      {done && (
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <CheckCircle2 size={48} color="#0A7E3E" />
          </div>
          <h2>Password updated</h2>
          <p className="lede">You can now sign in with your new password.</p>
          <button className="btn btn-primary auth-submit" type="button" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}
