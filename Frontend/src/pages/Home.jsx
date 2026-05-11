import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Heart, Shield } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import { SkeletonGrid, Skeleton } from '../components/Skeleton';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [trending, setTrending] = useState([]);
  const [sellers,  setSellers]  = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [activeUni, setActiveUni] = useState('ug');
  const [saved, setSaved] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      sbay.getUniversities(),
      sbay.getTrending(),
      sbay.getSellers(),
      sbay.getRecent(),
    ]).then(([u, t, s, r]) => {
      setUniversities(u); setTrending(t); setSellers(s); setRecent(r);
    });
  }, []);

  const toggleSave = (e, id) => {
    e.stopPropagation();
    setSaved((p) => ({ ...p, [id]: !p[id] }));
  };

  // Live in-page filtering — search results replace the regular sections.
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return [...trending, ...recent].filter((p) =>
      p.title.toLowerCase().includes(q)
    );
  }, [q, trending, recent]);

  const featuredSellers = sellers.slice(0, 2);

  return (
    <div className="home">
      <TopBar
        hideActions
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search phones, books, sneakers, snacks..."
      />

      {/* University filter chips (hidden while searching to keep focus on results) */}
      {!q && (
        <div className="uni-chips">
          {universities.map((u) => (
            <button
              key={u.id}
              className={`chip ${activeUni === u.id ? 'active' : ''}`}
              onClick={() => setActiveUni(u.id)}
            >
              {u.label}
            </button>
          ))}
        </div>
      )}

      <main className="home-main">
        {/* Search results take over when there's a query */}
        {matches !== null ? (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">
                {matches.length} result{matches.length === 1 ? '' : 's'} for "{query}"
              </h2>
            </div>
            {matches.length === 0 ? (
              <div className="empty">
                <div className="emo">🔍</div>
                <h3>Nothing matched your search</h3>
                <p className="muted">Try a different keyword or campus.</p>
              </div>
            ) : (
              <div className="recent-grid">
                {matches.map((p, i) => (
                  <motion.article
                    key={p.id}
                    className="recent-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="recent-img" style={{ backgroundImage: `url(${p.image})` }} />
                    <div className="recent-body">
                      <h4 className="prod-title">{p.title}</h4>
                      <span className="price">GH₵ {p.price.toLocaleString()}</span>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Trending — horizontal scroll, no arrow buttons */}
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Trending on Campus</h2>
                <button className="view-all" onClick={() => navigate('/trending')}>
                  View all <ArrowRight size={14} />
                </button>
              </div>

              {trending.length === 0 && <SkeletonGrid count={3} />}
              <div className="trend-scroller">
                {trending.map((p, i) => (
                  <motion.article
                    key={p.id}
                    className="trend-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="trend-img" style={{ backgroundImage: `url(${p.image})` }}>
                      {p.badge && (
                        <span className={`pill ${p.badge === 'TRENDING' ? 'pill-gold' : 'pill-red'}`}>
                          {p.badge === 'TRENDING' ? '🔥 TRENDING' : 'HOTTEST'}
                        </span>
                      )}
                    </div>
                    <div className="trend-body">
                      <div className="trend-row">
                        <h3 className="prod-title">{p.title}</h3>
                        <span className="price">GH₵ {p.price.toLocaleString()}</span>
                      </div>
                      <p className="prod-meta">{p.condition} · {p.campus}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>

            {/* Trusted Campus Sellers — only 2 + View more */}
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Trusted Campus Sellers</h2>
                <button className="view-all" onClick={() => navigate('/sellers')}>
                  View more <ArrowRight size={14} />
                </button>
              </div>
              {sellers.length === 0 && <Skeleton h={140} r={16} />}
              <div className="sellers-featured">
                {featuredSellers.map((s) => (
                  <article
                    key={s.id}
                    className="seller-big"
                    onClick={() => navigate(`/sellers/${s.id}`)}
                  >
                    <div className="seller-avatar xl" style={{ backgroundImage: `url(${s.avatar})` }} />
                    <div className="seller-info">
                      <h4>
                        {s.name}
                        {s.verified && <Shield size={14} color="#0A7E3E" />}
                      </h4>
                      <p className="muted small">{s.tagline}</p>
                      <p className="seller-rating">
                        <Star size={14} fill="#F5A623" color="#F5A623" />
                        <strong>{s.rating}</strong>
                        <span className="muted">({s.reviews} reviews)</span>
                      </p>
                    </div>
                    <ArrowRight size={18} className="seller-chev" />
                  </article>
                ))}
              </div>
            </section>

            {/* Recently Added */}
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Recently Added</h2>
                <button className="view-all" onClick={() => navigate('/categories')}>
                  See more <ArrowRight size={14} />
                </button>
              </div>

              {recent.length === 0 && <SkeletonGrid count={4} />}

              <div className="recent-grid">
                {recent.map((p, i) => (
                  <motion.article
                    key={p.id}
                    className="recent-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="recent-img" style={{ backgroundImage: `url(${p.image})` }}>
                      <button
                        className={`heart-btn ${saved[p.id] ? 'saved' : ''}`}
                        onClick={(e) => toggleSave(e, p.id)}
                        aria-label="Save"
                      >
                        <Heart size={16} fill={saved[p.id] ? '#D32F2F' : 'none'} />
                      </button>
                    </div>
                    <div className="recent-body">
                      <span className="tag">{p.tag}</span>
                      <h4 className="prod-title">{p.title}</h4>
                      <div className="recent-row">
                        <span className="price">GH₵ {p.price.toLocaleString()}</span>
                        <span className="posted">{p.posted}</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
