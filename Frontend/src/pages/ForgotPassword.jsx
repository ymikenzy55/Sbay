import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset, verifyResetCode, resetPassword } = useAuth();

  // step: 'request' | 'verify' | 'reset' | 'done'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState('');

  const sendCode = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setDevCode(res.devCode || '');
      setStep('verify');
    } catch (e2) { setErr(e2.message || 'Could not send code.'); }
    finally { setBusy(false); }
  };

  const checkCode = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await verifyResetCode(email.trim(), code.trim());
      setStep('reset');
    } catch (e2) { setErr(e2.message || 'Verification failed.'); }
    finally { setBusy(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw !== pw2) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPassword(email.trim(), pw);
      setStep('done');
    } catch (e2) { setErr(e2.message || 'Could not reset password.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setErr('');
    try {
      const res = await requestPasswordReset(email.trim());
      setDevCode(res.devCode || '');
    } catch (e2) { setErr(e2.message || 'Could not resend.'); }
  };

  return (
    <div className="auth-page kente-bg">
      <button
        className="auth-back"
        onClick={() => (step === 'request' ? navigate(-1) : setStep(step === 'verify' ? 'request' : 'verify'))}
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="auth-logo"><Logo size="lg" /></div>

      {step === 'request' && (
        <form className="auth-card" onSubmit={sendCode}>
          <h2>Forgot password</h2>
          <p className="lede">Enter your email and we'll send you a 6-digit reset code.</p>

          <div className="field">
            <label>Email</label>
            <div className="field-input">
              <Mail size={16} className="lead" />
              <input
                type="email"
                placeholder="you@campus.edu.gh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset code'}
          </button>

          <p className="auth-foot">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form className="auth-card" onSubmit={checkCode}>
          <h2>Enter your code</h2>
          <p className="lede">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>

          {devCode && (
            <div className="auth-hint">
              Dev mode: your code is <strong>{devCode}</strong>
            </div>
          )}

          <div className="field">
            <label>Verification code</label>
            <div className="field-input">
              <KeyRound size={16} className="lead" />
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy || code.length < 6}>
            {busy ? 'Verifying...' : 'Verify code'}
          </button>

          <p className="auth-foot">
            Didn't get it? <a onClick={resend} style={{ cursor: 'pointer' }}>Resend code</a>
          </p>
        </form>
      )}

      {step === 'reset' && (
        <form className="auth-card" onSubmit={savePassword}>
          <h2>Choose a new password</h2>
          <p className="lede">Pick something strong and easy for you to remember.</p>

          <div className="field">
            <label>New password</label>
            <div className="field-input">
              <Lock size={16} className="lead" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={6}
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
                placeholder="••••••••"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                minLength={6}
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

      {step === 'done' && (
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <CheckCircle2 size={48} color="#0A7E3E" />
          </div>
          <h2>Password updated</h2>
          <p className="lede">You can now sign in with your new password.</p>
          <button
            className="btn btn-primary auth-submit"
            type="button"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}
