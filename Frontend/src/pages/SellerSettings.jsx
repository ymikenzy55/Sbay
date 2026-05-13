import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Check, Lock, MapPin, Store, Phone, Mail, Wallet, Bell, Plane,
  ShieldCheck, ShieldAlert, Crown, LogOut, Trash2,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './Auth.css';
import './SellerSettings.css';

export default function SellerSettings() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    storeName: user?.sellerProfile?.storeName || '',
    bio:       user?.sellerProfile?.bio || '',
    phone:     user?.phone || '',
    email:     user?.email || '',
    location:  user?.location || 'UG, Legon',
    avatar:    user?.avatar || '',

    payoutMethod: user?.payout?.method || 'momo',
    payoutAccount: user?.payout?.account || '',
    payoutName: user?.payout?.name || user?.name || '',

    vacationMode: user?.vacationMode || false,
    notifyOrders:    user?.notifications?.orders ?? true,
    notifyMessages:  user?.notifications?.messages ?? true,
    notifyPromos:    user?.notifications?.promos ?? false,

    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savedAt, setSavedAt] = useState(null);
  const [pwErr, setPwErr] = useState('');
  const [pwOk, setPwOk] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('avatar', reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    updateUser({
      name: user?.name,
      avatar: form.avatar,
      email: form.email,
      phone: form.phone,
      location: form.location,
      sellerProfile: { ...(user?.sellerProfile || {}), storeName: form.storeName, bio: form.bio },
      payout: { method: form.payoutMethod, account: form.payoutAccount, name: form.payoutName },
      vacationMode: form.vacationMode,
      notifications: {
        orders: form.notifyOrders,
        messages: form.notifyMessages,
        promos: form.notifyPromos,
      },
    });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2400);
  };

  const changePassword = (e) => {
    e.preventDefault();
    setPwErr(''); setPwOk(false);
    if (!form.currentPassword) return setPwErr('Enter your current password.');
    if (!form.newPassword || form.newPassword.length < 6) return setPwErr('New password must be 6+ characters.');
    if (form.newPassword !== form.confirmPassword) return setPwErr('Passwords do not match.');
    // Mock: just succeed.
    setForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    setPwOk(true);
    setTimeout(() => setPwOk(false), 2400);
  };

  const onLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      body: 'You will need to sign in again to access your seller dashboard.',
      confirmLabel: 'Sign Out',
      danger: true,
    });
    if (ok) { logout(); navigate('/'); }
  };

  const onDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account?',
      body: 'This permanently removes your store, listings and chat history. This cannot be undone.',
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!ok) return;
    logout();
    navigate('/', { replace: true });
  };

  const verificationStatus = user?.verification?.status || (user?.verified ? 'verified' : 'unverified');
  const planId = user?.subscription?.plan || 'free';

  return (
    <div className="page">
      <TopBar showBack showSearch={false} title="Settings" />

      <main className="page-main">
        {/* Quick links */}
        <section className="ss-quick">
          <div className={`ss-quick-row read-only ${verificationStatus === 'verified' ? 'is-ok' : 'is-warn'}`}>
            <span className="ic">
              {verificationStatus === 'verified' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            </span>
            <div>
              <strong>{verificationStatus === 'verified' ? 'Verified seller' : 'Not yet verified'}</strong>
              <p className="muted small">
                {verificationStatus === 'verified'
                  ? 'Your account has been approved by sBay admins.'
                  : 'Admins are reviewing your application. You\'ll be notified once approved.'}
              </p>
            </div>
          </div>
          <button className="ss-quick-row" onClick={() => navigate('/seller/subscription')}>
            <span className="ic"><Crown size={18} /></span>
            <div>
              <strong>Subscription</strong>
              <p className="muted small">Plan: {planId.charAt(0).toUpperCase() + planId.slice(1)}</p>
            </div>
          </button>
        </section>

        <form className="settings-form" onSubmit={saveProfile}>
          {/* Store identity */}
          <section className="card">
            <h3 className="page-h2"><Store size={16} /> Store identity</h3>
            <div className="avatar-row">
              <div
                className="avatar-preview"
                style={{ backgroundImage: `url(${form.avatar || user?.avatar})` }}
              />
              <label className="btn btn-ghost">
                <Camera size={16} /> Change photo
                <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
              </label>
            </div>
            <label className="field">
              <span>Store name</span>
              <input value={form.storeName} onChange={(e) => set('storeName', e.target.value)} placeholder="e.g. Kofi Gadgets" />
            </label>
            <label className="field">
              <span>Bio</span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell buyers what your store sells and where you ship."
              />
            </label>
          </section>

          {/* Contact */}
          <section className="card">
            <h3 className="page-h2"><Mail size={16} /> Contact</h3>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className="field">
              <span><Phone size={14} /> Phone (+233)</span>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+233 24 000 0000" />
            </label>
            <label className="field">
              <span><MapPin size={14} /> Default pickup location</span>
              <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Night Market, UG Legon" />
            </label>
          </section>

          {/* Payout */}
          <section className="card">
            <h3 className="page-h2"><Wallet size={16} /> Payout method</h3>
            <p className="muted small">How you'd like to receive your earnings.</p>
            <div className="pay-methods">
              {[
                { id: 'momo', label: 'MTN MoMo' },
                { id: 'card', label: 'Bank card' },
                { id: 'bank', label: 'Bank transfer' },
              ].map((m) => (
                <label key={m.id} className={`pay-method ${form.payoutMethod === m.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payout"
                    checked={form.payoutMethod === m.id}
                    onChange={() => set('payoutMethod', m.id)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
            <label className="field">
              <span>Account / number</span>
              <input
                value={form.payoutAccount}
                onChange={(e) => set('payoutAccount', e.target.value)}
                placeholder={form.payoutMethod === 'momo' ? '02XX XXX XXXX' : 'Account number'}
              />
            </label>
            <label className="field">
              <span>Account name</span>
              <input
                value={form.payoutName}
                onChange={(e) => set('payoutName', e.target.value)}
                placeholder="As registered with your bank / MoMo"
              />
            </label>
          </section>

          {/* Preferences */}
          <section className="card">
            <h3 className="page-h2"><Bell size={16} /> Preferences</h3>
            <Toggle
              label="Vacation mode"
              hint="Hide your listings from search until you turn this off."
              icon={<Plane size={16} />}
              checked={form.vacationMode}
              onChange={(v) => set('vacationMode', v)}
            />
            <Toggle
              label="Order notifications"
              hint="Push & email when someone places an order."
              checked={form.notifyOrders}
              onChange={(v) => set('notifyOrders', v)}
            />
            <Toggle
              label="Buyer messages"
              hint="Notify me when buyers send a chat."
              checked={form.notifyMessages}
              onChange={(v) => set('notifyMessages', v)}
            />
            <Toggle
              label="Promotions & tips"
              hint="Occasional emails about boosts and selling tips."
              checked={form.notifyPromos}
              onChange={(v) => set('notifyPromos', v)}
            />
          </section>

          <div className="settings-actions">
            <button className="btn btn-primary" type="submit">
              <Check size={16} /> Save changes
            </button>
            {savedAt && <span className="muted small">Saved.</span>}
          </div>
        </form>

        {/* Password */}
        <form className="settings-form" onSubmit={changePassword}>
          <section className="card">
            <h3 className="page-h2"><Lock size={16} /> Change password</h3>
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => set('currentPassword', e.target.value)}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => set('newPassword', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
              />
            </label>

            {pwErr && <div className="auth-error">{pwErr}</div>}
            {pwOk && <div className="auth-hint">Password updated.</div>}

            <button className="btn btn-primary" type="submit" style={{ marginTop: 10 }}>
              Update password
            </button>
          </section>
        </form>

        {/* Danger zone */}
        <section className="card danger-zone">
          <h3 className="page-h2">Danger zone</h3>
          <button className="btn btn-ghost danger-text" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
          <button className="btn btn-ghost danger-text" onClick={onDeleteAccount}>
            <Trash2 size={16} /> Delete account
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function Toggle({ label, hint, icon, checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle-row ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <div className="toggle-text">
        <strong>{icon} {label}</strong>
        {hint && <p className="muted small">{hint}</p>}
      </div>
      <span className={`switch ${checked ? 'on' : ''}`}>
        <span className="dot" />
      </span>
    </button>
  );
}
