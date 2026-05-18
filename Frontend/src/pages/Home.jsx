import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Heart, Shield, MapPin, Search as SearchIcon, Flame, Package } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import { SkeletonGrid, Skeleton } from '../components/Skeleton';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      sbay.getTrending(),
      sbay.getSellers(),
      sbay.getRecent(),
    ]).then(([trendingRes, sellersRes, recentRes]) => {
      if (!active) return;
      setTrending(trendingRes.status === 'fulfilled' ? trendingRes.value : []);
      setSellers(sellersRes.status === 'fulfilled' ? sellersRes.value : []);
      setRecent(recentRes.status === 'fulfilled' ? recentRes.value : []);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleSave = (e, id) => {
    e.stopPropagation();
    setSaved((p) => ({ ...p, [id]: !p[id] }));
  };

  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return null;
    return [...trending, ...recent].filter((p) =>
      p.title.toLowerCase().includes(q)
    );
  }, [q, trending, recent]);

  const featuredSellers = sellers.slice(0, 2);
  const noListingsYet = !loading && trending.length === 0 && recent.length === 0 && sellers.length === 0;

  return (
    <div className="home">
      <TopBar
        hideActions
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search phones, books, sneakers, snacks..."
      />

      <main className="home-main">
        {matches !== null ? (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">
                {matches.length} result{matches.length === 1 ? '' : 's'} for "{query}"
              </h2>
            </div>
            {matches.length === 0 ? (
              <div className="empty">
                <div className="emo"><SearchIcon size={44} /></div>
                <h3>Nothing matched your search</h3>
                <p className="muted">Try a different keyword.</p>
              </div>
            ) : (
              <div className="recent-grid">
                {matches.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    i={i}
                    saved={saved[p.id]}
                    toggleSave={toggleSave}
                    onClick={() => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : noListingsYet ? (
          <section className="section">
            <div className="empty">
              <div className="emo"><Package size={44} /></div>
              <h3>No products yet</h3>
              <p className="muted">Listings will appear here once sellers start posting items on campus.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Trending on Campus</h2>
                <button className="view-all" onClick={() => navigate('/trending')}>
                  View all <ArrowRight size={14} />
                </button>
              </div>

              {loading ? (
                <SkeletonGrid count={3} />
              ) : trending.length === 0 ? (
                <div className="empty">
                  <div className="emo"><Flame size={44} /></div>
                  <h3>No trending products yet</h3>
                  <p className="muted">Once buyers start viewing and purchasing items, the hottest listings will show up here.</p>
                </div>
              ) : (
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
                            {p.badge === 'TRENDING' ? <><Flame size={12} /> TRENDING</> : 'HOTTEST'}
                          </span>
                        )}
                      </div>
                      <div className="trend-body">
                        <div className="trend-row">
                          <h3 className="prod-title">{p.title}</h3>
                          <span className="price">GH₵ {p.price.toLocaleString()}</span>
                        </div>
                        <p className="prod-meta">
                          <MapPin size={12} /> {p.school}{p.city ? `, ${p.city}` : ''}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Trusted Campus Sellers</h2>
              </div>

              {loading ? (
                <Skeleton h={140} r={16} />
              ) : sellers.length === 0 ? (
                <div className="empty">
                  <div className="emo"><Shield size={44} /></div>
                  <h3>No sellers featured yet</h3>
                  <p className="muted">Seller profiles will appear here after listings are posted.</p>
                </div>
              ) : (
                <div className="sellers-featured">
                  {featuredSellers.map((s) => (
                    <article
                      key={s.id}
                      className="seller-big"
                      onClick={() => navigate(`/seller/${s.id}`)}
                    >
                      <div className="seller-avatar xl" style={{ backgroundImage: `url(${s.avatar})` }} />
                      <div className="seller-info">
                        <h4>
                          {s.name}
                          {s.verified && (
                            <span className="verified-pill" title="Verified seller">
                              <Shield size={11} /> Verified
                            </span>
                          )}
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
              )}
            </section>

            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Recently Added</h2>
                <button className="view-all" onClick={() => navigate('/categories')}>
                  See more <ArrowRight size={14} />
                </button>
              </div>

              {loading ? (
                <SkeletonGrid count={4} />
              ) : recent.length === 0 ? (
                <div className="empty">
                  <div className="emo"><Package size={44} /></div>
                  <h3>No products added yet</h3>
                  <p className="muted">As soon as sellers publish new listings, they’ll appear here.</p>
                </div>
              ) : (
                <div className="recent-grid">
                  {recent.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      i={i}
                      saved={saved[p.id]}
                      toggleSave={toggleSave}
                      onClick={() => navigate(`/product/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/** Card showing campus + hall location and a save heart. */
function ProductCard({ p, i, saved, toggleSave, onClick }) {
  return (
    <motion.article
      className="recent-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="recent-img" style={{ backgroundImage: `url(${p.image})` }}>
        <button
          className={`heart-btn ${saved ? 'saved' : ''}`}
          onClick={(e) => toggleSave(e, p.id)}
          aria-label="Save"
        >
          <Heart size={16} fill={saved ? '#D32F2F' : 'none'} />
        </button>
      </div>
      <div className="recent-body">
        {p.tag && <span className="tag">{p.tag}</span>}
        <h4 className="prod-title">{p.title}</h4>
        <div className="recent-row">
          <span className="price">GH₵ {p.price.toLocaleString()}</span>
        </div>
        <p className="prod-loc">
          <MapPin size={12} />
          <span>{p.school}{p.city ? `, ${p.city}` : ''}</span>
        </p>
      </div>
    </motion.article>
  );
}
