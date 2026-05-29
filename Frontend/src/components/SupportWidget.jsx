import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headphones, MessageCircle, X, Send, Loader2, GripVertical, Mail, Phone } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { api } from '../api/client';
import './SupportWidget.css';

/** Clamp a value between min and max. */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function SupportWidget() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Show only on the homepage.
  const isHomepage = pathname === '/home';

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });

  // ---- Drag state ----
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useState({
    dragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  })[0];

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragState.dragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.startPosX = pos.x;
    dragState.startPosY = pos.y;
    dragState.moved = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragState.dragging) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragState.moved = true;
    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 140;
    setPos({
      x: clamp(dragState.startPosX + dx, 0, maxX),
      y: clamp(dragState.startPosY + dy, -(maxY), 0),
    });
  };

  const onPointerUp = (e) => {
    dragState.dragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!dragState.moved) setOpen((o) => !o);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.phone.trim() || !form.message.trim()) return;

    setSending(true);
    setError('');
    try {
      await api.post('/support/tickets', {
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setError(err?.message || 'Failed to send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isHomepage) return null;

  return (
    <>
      <div
        className="support-fab"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="button"
        tabIndex={0}
        aria-label={open ? 'Close support form' : 'Open support form'}
      >
        <GripVertical size={14} className="support-grip" />
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </div>

      {open && (
        <div className="support-panel" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
          <header className="support-header">
            <span className="support-header-icon"><Headphones size={18} /></span>
            <div>
              <strong>Customer Support</strong>
              <small>We usually respond shortly</small>
            </div>
            <button className="support-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </header>

          <form className="support-form" onSubmit={submit}>
            <p>Tell us what happened and how to reach you.</p>

            <label className="support-field">
              <span>Gmail address *</span>
              <div className="support-input-wrap">
                <Mail size={15} />
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </label>

            <label className="support-field">
              <span>Phone number *</span>
              <div className="support-input-wrap">
                <Phone size={15} />
                <input
                  type="tel"
                  placeholder="Your phone number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                  required
                />
              </div>
            </label>

            <label className="support-field">
              <span>Describe your problem *</span>
              <textarea
                placeholder="Tell us what's wrong..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                required
              />
            </label>

            {error && <p className="support-error" role="alert">{error}</p>}
            {sent && <p className="support-success">Message sent successfully. We may get back to you shortly.</p>}

            <button
              type="submit"
              className="btn btn-primary support-submit"
              disabled={sending || !form.email.trim() || !form.phone.trim() || !form.message.trim()}
            >
              {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              <span>{sending ? 'Sending…' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
