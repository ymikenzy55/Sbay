import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Camera, Lock, MapPin } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import './pages.css';
import './Profile.css';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || 'UG, Legon',
    avatar: user?.avatar || '',
    password: '',
    newPassword: '',
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'seller') {
    return <Navigate to="/seller-dashboard" replace />;
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((s) => ({ ...s, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateUser?.({
        name: settings.name,
        email: settings.email,
        location: settings.location,
        avatar: settings.avatar,
      });
      setSettings((s) => ({ ...s, password: '', newPassword: '' }));
      navigate('/profile');
    } catch (err) {
      alert(err.message || 'Could not save changes.');
    }
  };

  return (
    <div className="page">
      <TopBar showSearch={false} title="Settings" />
      <main className="page-main">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
        <form className="settings-form" onSubmit={saveSettings}>
          <section className="card">
            <h3 className="page-h2">Profile picture</h3>
            <div className="avatar-row">
              <div
                className="avatar-preview"
                style={{ backgroundImage: `url(${settings.avatar || user?.avatar})` }}
              />
              <label className="btn btn-ghost">
                <Camera size={16} /> Change photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  hidden
                />
              </label>
            </div>
          </section>

          <section className="card">
            <h3 className="page-h2">Personal info</h3>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </label>
            <label className="field">
              <span><MapPin size={14} /> Default pickup location</span>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                placeholder="e.g. Night Market, UG Legon"
              />
            </label>
          </section>

          <section className="card">
            <h3 className="page-h2"><Lock size={16} /> Change password</h3>
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={settings.newPassword}
                onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
              />
            </label>
          </section>

          <button className="btn btn-primary" type="submit">
            <Check size={16} /> Save changes
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}