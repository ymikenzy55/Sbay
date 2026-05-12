import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Shield, ArrowRight, MessageCircle, Search } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SkeletonList, SkeletonGrid, Skeleton } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './AllSellers.css';

const SAMPLE_REVIEWS = [
  { id: 1, name: 'Akua',   rating: 5, text: 'Exactly as described!',    time: '3d' },
  { id: 2, name: 'Kwame',  rating: 5, text: 'Fast reply, smooth trade.', time: '1w' },
  { id: 3, name: 'Adwoa',  rating: 4, text: 'Good condition. Will buy again.', time: '2w' },
];

export default function AllSellers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState(null);
  const [seller, setSeller]   = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => { sbay.getSellers().then(setSellers); }, []);

  // If no seller id in the URL, auto-select the first one when list loads.
  const activeId = id || sellers?.[0]?.id;

  useEffect(() => {
    if (!activeId) return;
    setSeller(null);
    sbay.getSeller(activeId).then(setSeller);
  }, [activeId]);

  const filtered = useMemo(
    () => (sellers || []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase())),
    [sellers, q]
  );

  const onChat = () => navigate('/chat/c1');

  return (
    <div className="page as-page">
      <TopBar showBack title="All Sellers" />

      <div className="as-layout">
        {/* Seller sidebar */}
        <aside className="as-sidebar">
          <div className="as-search">
            <Search size={14} />
            <input
              placeholder="Search sellers..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {!sellers ? (
            <SkeletonList count={4} />
          ) : (
            <ul className="as-list">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    className={`as-seller-row ${activeId === s.id ? 'active' : ''}`}
                    onClick={() => navigate(`/sellers/${s.id}`)}
                  >
                    <div className="as-avatar" style={{ backgroundImage: `url(${s.avatar})` }} />
                    <div className="as-info">
                      <h4>
                        {s.name}
                        {s.verified && <Shield size={12} color="#0A7E3E" />}
                      </h4>
                      <p className="muted small">
                        <Star size={11} fill="#F5A623" color="#F5A623" /> {s.rating} · {s.reviews}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main seller detail */}
        <main className="as-main">
          {!seller ? (
            <>
              <Skeleton h={160} r={16} />
              <SkeletonGrid count={6} />
            </>
          ) : (
            <>
              <section className="as-hero">
                <div className="as-hero-avatar" style={{ backgroundImage: `url(${seller.avatar})` }} />
                <div className="as-hero-info">
                  <h2>
                    {seller.name}
                    {seller.verified && <Shield size={16} color="#F5A623" />}
                  </h2>
                  <p className="as-hero-meta">
                    <span><Star size={14} fill="#F5A623" color="#F5A623" /> <strong>{seller.rating}</strong> ({seller.reviews})</span>
                    <span>· {seller.university}</span>
                  </p>
                  <p className="as-bio">{seller.bio}</p>
                  <div className="as-hero-actions">
                    <button className="btn btn-primary" onClick={onChat}>
                      <MessageCircle size={14} /> Message
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate(`/seller/${seller.id}`)}>
                      Full profile <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </section>

              <section className="as-section">
                <h3>Listings ({seller.listings.length})</h3>
                {seller.listings.length === 0 ? (
                  <p className="muted small">This seller has no active listings.</p>
                ) : (
                  <div className="as-products">
                    {seller.listings.map((p, i) => (
                      <motion.article
                        key={p.id}
                        className="result-card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/product/${p.id}`)}
                      >
                        <div className="result-img" style={{ backgroundImage: `url(${p.image})` }} />
                        <div className="result-body">
                          <h4 className="prod-title">{p.title}</h4>
                          <div className="star-row">
                            {Array.from({ length: 5 }).map((_, n) => (
                              <Star key={n} size={12} fill={n < 4 ? '#F5A623' : 'transparent'} color="#F5A623" />
                            ))}
                            <span className="muted small">(12)</span>
                          </div>
                          <span className="price">GH₵ {p.price.toLocaleString()}</span>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </section>

              <section className="as-section">
                <h3>Reviews ({seller.reviews})</h3>
                <div className="as-reviews">
                  {SAMPLE_REVIEWS.map((r) => (
                    <article key={r.id} className="card review-card">
                      <div className="review-head">
                        <strong>{r.name}</strong>
                        <span className="muted">{r.time}</span>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} fill={i < r.rating ? '#F5A623' : '#E5E4E7'} color={i < r.rating ? '#F5A623' : '#E5E4E7'} />
                        ))}
                      </div>
                      <p style={{ marginTop: 6 }}>{r.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
