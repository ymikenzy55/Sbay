import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smile, Paperclip, Mic, Send, Package } from 'lucide-react';
import { sbay } from '../api/client';
import './pages.css';
import './IndividualChat.css';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80';

export default function IndividualChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passed = location.state || {};
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    sbay.getChats().then((cs) => {
      const direct = cs.find((c) => c.id === id);
      if (direct) return setChat(direct);
      // If routed from "Message seller" with state, match by sellerId or
      // fall back to a synthetic conversation stub for that seller.
      if (passed.seller) {
        const bySeller = cs.find((c) => c.sellerId === passed.seller.id);
        if (bySeller) return setChat(bySeller);
        return setChat({
          id,
          sellerId: passed.seller.id,
          name: passed.seller.name,
          avatar: FALLBACK_AVATAR,
          last: '',
          time: 'now',
          unread: 0,
        });
      }
      setChat(cs[0]);
    });
    sbay.getMessages(id).then(setMessages);
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = { id: Date.now(), from: 'me', text: text.trim(), time: 'now' };
    setMessages((m) => [...m, msg]);
    setText('');
    // simulated reply
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: 'them', text: 'Got it 👌', time: 'now' },
      ]);
    }, 1400);
  };

  if (!chat) return <div className="page"><p className="page-main muted">Loading...</p></div>;

  return (
    <div className="page chat-page">
      <header className="chat-top">
        <button className="round-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="chat-avatar sm" style={{ backgroundImage: `url(${chat.avatar})` }} />
        <div style={{ flex: 1 }}>
          <h4>{chat.name}</h4>
          <p className="muted" style={{ fontSize: '.78rem' }}>online</p>
        </div>
      </header>

      {passed.order ? (
        <div className="order-banner">
          <Package size={16} />
          <span>Order #{passed.order.id} · {passed.order.title}</span>
          <strong>GH₵ {passed.order.price?.toLocaleString?.() ?? passed.order.price}</strong>
        </div>
      ) : (
        <div className="order-banner">
          <Package size={16} />
          <span>Order #SB-2031 · iPad Pro 12.9"</span>
          <strong>GH₵ 4,500</strong>
        </div>
      )}

      <main className="chat-stream">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            className={`bubble ${m.from === 'me' ? 'me' : 'them'}`}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            {m.text}
            <span className="t">{m.time}</span>
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div
              className="bubble them typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="dot" /><span className="dot" /><span className="dot" />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </main>

      <form className="chat-input" onSubmit={send}>
        <button type="button" className="ic" aria-label="Emoji"><Smile size={20} /></button>
        <button type="button" className="ic" aria-label="Attach"><Paperclip size={20} /></button>
        <input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text ? (
          <button type="submit" className="send" aria-label="Send"><Send size={18} /></button>
        ) : (
          <button type="button" className="ic" aria-label="Voice"><Mic size={20} /></button>
        )}
      </form>
    </div>
  );
}
