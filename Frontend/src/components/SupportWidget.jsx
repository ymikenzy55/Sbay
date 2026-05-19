import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, GripVertical } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api/client';
import './SupportWidget.css';

/** Clamp a value between min and max. */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function SupportWidget() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { on, off } = useSocket();

  // Hide on admin routes.
  const isAdmin = pathname.startsWith('/admin');

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  // ---- Drag state ----
  const fabRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from default position
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });

  // Pre-fill form if logged in — skip the details form entirely.
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  // Listen for admin replies via socket.
  useEffect(() => {
    const handler = (payload) => {
      setMessages((m) => [...m, {
        fromAdmin: true,
        body: payload?.body || 'An admin has replied to your ticket.',
      }]);
    };
    on('support:reply', handler);
    return () => off('support:reply', handler);
  }, [on, off]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Drag handlers (pointer events for mouse + touch) ----
  const onPointerDown = useCallback((e) => {
    // Only drag with primary button.
    if (e.button !== 0) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.dragging) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) ds.moved = true;
    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 140; // keep above bottom nav
    setPos({
      x: clamp(ds.startPosX + dx, 0, maxX),
      y: clamp(ds.startPosY + dy, -(maxY), 0),
    });
  }, []);

  const onPointerUp = useCallback((e) => {
    const ds = dragState.current;
    ds.dragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    // If user didn't drag, treat as click.
    if (!ds.moved) setOpen((o) => !o);
  }, []);

  // ---- Chat logic ----
  const startChat = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    setStarted(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const body = input.trim();
    setInput('');
    setMessages((m) => [...m, { fromAdmin: false, body }]);
    setSending(true);
    try {
      await api.post('/support/tickets', {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: messages.length === 0 ? body.slice(0, 80) : undefined,
        message: body,
      });
    } catch {
      setMessages((m) => [...m, { fromAdmin: true, body: 'Failed to send. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isAdmin) return null;

  return (
    <>
      {/* Draggable floating button */}
      <div
        ref={fabRef}
        className="support-fab"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="button"
        tabIndex={0}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        <GripVertical size={14} className="support-grip" />
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </div>

      {/* Chat panel — anchored relative to FAB position */}
      {open && (
        <div className="support-panel" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
          <header className="support-header">
            <MessageCircle size={18} />
            <span>Customer Support</span>
            <button className="support-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </header>

          {!started ? (
            <form className="support-form" onSubmit={startChat}>
              <p>👋 Hi there! Please share your details so we can help you.</p>
              <input
                type="text"
                placeholder="Your name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Gmail address *"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="tel"
                placeholder="Contact number *"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                required
              />
              <button type="submit" className="btn btn-primary">Start Chat</button>
            </form>
          ) : (
            <>
              <div className="support-messages">
                {messages.length === 0 && (
                  <p className="support-empty">Send us a message and we'll get back to you shortly!</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`support-msg ${m.fromAdmin ? 'admin' : 'user'}`}>
                    {m.body}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="support-input">
                <textarea
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()} aria-label="Send">
                  {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
