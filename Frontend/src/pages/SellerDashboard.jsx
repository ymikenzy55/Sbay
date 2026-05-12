import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, MessageCircle, Package, TrendingUp, Wallet,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { sbay } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [listings, setListings] = useState([]);
  const [chats, setChats] = useState([]);
  const [tab, setTab] = useState('listings');

  useEffect(() => {
    sbay.getRecent().then(setListings);
    sbay.getChats().then(setChats);
  }, []);

  const onDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete this listing?',
      body: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) setListings((ls) => ls.filter((l) => l.id !== id));
  };

  return (
    <div className="page">
      <TopBar showSearch={false} title="Seller Dashboard" />

      <main className="page-main">
        <section className="sd-hero">
          <div>
            <p className="muted">Welcome back,</p>
            <h2>{user?.sellerProfile?.storeName || user?.name || 'Seller'}</h2>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/sell')}>
            <Plus size={16} /> New Listing
          </button>
        </section>

        <section className="sd-stats">
          <div className="stat">
            <span className="ic"><Package size={18} /></span>
            <strong>{listings.length}</strong>
            <span>Active listings</span>
          </div>
          <div className="stat">
            <span className="ic"><TrendingUp size={18} /></span>
            <strong>247</strong>
            <span>Profile views</span>
          </div>
          <div className="stat">
            <span className="ic"><Wallet size={18} /></span>
            <strong>GH₵ 8,420</strong>
            <span>Earnings</span>
          </div>
        </section>

        <div className="sd-tabs">
          <button className={`sd-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
            My Listings
          </button>
          <button className={`sd-tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
            Buyer Messages {chats.some((c) => c.unread > 0) && <span className="badge-dot" />}
          </button>
        </div>

        {tab === 'listings' ? (
          <div className="sd-listings">
            {listings.map((p, i) => (
              <motion.article
                key={p.id}
                className="sd-listing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="sd-thumb" style={{ backgroundImage: `url(${p.image})` }} />
                <div className="sd-meta">
                  <h4>{p.title}</h4>
                  <p className="muted small">{p.tag} · {p.posted}</p>
                  <span className="price">GH₵ {p.price.toLocaleString()}</span>
                </div>
                <div className="sd-actions">
                  <button className="iac" onClick={() => navigate(`/product/${p.id}`)} aria-label="View">
                    <Eye size={16} />
                  </button>
                  <button className="iac" onClick={() => navigate('/sell')} aria-label="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="iac danger" onClick={() => onDelete(p.id, p.title)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.article>
            ))}
            {listings.length === 0 && (
              <div className="empty">
                <Package size={48} color="#C9D4BD" />
                <h3>No listings yet</h3>
                <p>Create your first listing to start selling.</p>
                <button className="btn btn-primary" onClick={() => navigate('/sell')}>
                  <Plus size={16} /> Create Listing
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="sd-chats">
            {chats.map((c) => (
              <button key={c.id} className="chat-row" onClick={() => navigate(`/chat/${c.id}`)}>
                <div className="chat-avatar" style={{ backgroundImage: `url(${c.avatar})` }} />
                <div className="chat-info">
                  <div className="chat-row-top">
                    <h4>{c.name}</h4>
                    <span className="muted">{c.time}</span>
                  </div>
                  <p className="muted last">{c.last}</p>
                </div>
                {c.unread > 0 && <span className="unread-pulse">{c.unread}</span>}
                <MessageCircle size={18} className="muted" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
