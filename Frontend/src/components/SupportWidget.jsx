import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api/client';
import './SupportWidget.css';

export default function SupportWidget() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Hide on admin routes.
  if (pathname.startsWith('/admin')) return null;
  const { on, off } = useSocket();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  // Pre-fill form if logged in.
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
      setStarted(true);
    }
  }, [user]);

  // Listen for admin replies.
  useEffect(() => {
    const handler = () => {
      // Refresh messages when we get a reply notification.
      // For simplicity, we just add a placeholder; a full impl would fetch the ticket.
      setMessages((m) => [...m, { fromAdmin: true, body: 'An admin has replied. Check your email for details.' }]);
    };
    on('support:reply', handler);
    return () => off('support:reply', handler);
  }, [on, off]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
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
        phone: form.phone,
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

  return (
    <>
      {/* Floating button */}
      <button
        className="support-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="support-panel">
          <header className="support-header">
            <MessageCircle size={20} />
            <span>Customer Support</span>
          </header>

          {!started ? (
            <form className="support-form" onSubmit={startChat}>
              <p>Hi! Please enter your details to start chatting.</p>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
