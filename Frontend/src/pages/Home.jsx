import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Heart, SlidersHorizontal, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { SkeletonGrid, Skeleton } from '../components/Skeleton';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goSell = () => {
    if (!user) navigate('/signup?next=' + encodeURIComponent('/become-seller'));
    else if (user.role !== 'seller') navigate('/become-seller');
    else navigate('/sell');
  };
  const [universities, setUniversities] = useState([]);
  const [trending, setTrending] = useState([]);
  const [sellers,  setSellers]  = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [activeUni, setActiveUni] = useState('ug');
  const [saved, setSaved] = useState({});
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [condition, setCondition] = useState('Any');

  const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Books', 'Sports', 'Beauty'];

  // Naive client-side filtering on mocked product fields.
  const filteredRecent = recent.filter((p) => {
    if (p.price > maxPrice) return false;
    if (condition !== 'Any' && !p.tag.toLowerCase().includes(condition.toLowerCase())) return false;
    return true;
  });
  const sortedRecent = [...filteredRecent].sort((a, b) => {
    if (sort === 'price-asc')  return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return 0;
  });

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

  return (
    <div className="home">
      <TopBar />

      {/* University filter chips */}
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

      {/* Category filter chips */}
      <div className="uni-chips">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        <button className="chip" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal size={12} /> Filters
        </button>
      </div>

      {showFilters && (
        <motion.div
          className="filter-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="filter-row-2">
            <div>
              <label>Max price · GH₵ {maxPrice.toLocaleString()}</label>
              <input
                type="range" min="500" max="10000" step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
              />
            </div>
            <div>
              <label>Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option>Any</option><option>New</option>
                <option>Used</option><option>Refurbished</option>
              </select>
            </div>
            <div>
              <label>Sort by</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
            <button
              className="chip"
              onClick={() => { setMaxPrice(10000); setCondition('Any'); setSort('latest'); setCategory('All'); }}
            >
              <X size={12} /> Clear
            </button>
          </div>
        </motion.div>
      )}

      <main className="home-main">
        {/* Trending */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Trending on Campus</h2>
            <button className="view-all" onClick={() => navigate('/search')}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          {trending.length === 0 && <SkeletonGrid count={3} />}
          <div className="trending-grid">
            {trending.map((p, i) => (
              <motion.article
                key={p.id}
                className="trend-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
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

        {/* Sellers */}
        <section className="section">
          <h2 className="section-title">Trusted Campus Sellers</h2>
          <div className="sellers-grid">
            {sellers.map((s) => (
              <article
                key={s.id}
                className="seller-card"
                onClick={() => navigate(`/seller/${s.id}`)}
              >
                <div className="seller-avatar" style={{ backgroundImage: `url(${s.avatar})` }} />
                <div className="seller-meta">
                  <h4>{s.name}</h4>
                  <p className="seller-rating">
                    <Star size={13} fill="#F5A623" color="#F5A623" />
                    {s.rating} ({s.reviews})
                  </p>
                </div>
              </article>
            ))}
            <article className="seller-cta">
              <div className="cta-text">
                <h4>Ready to sell?</h4>
                <p>Join 5,000+ students making money today.</p>
              </div>
              <button className="btn btn-secondary" onClick={goSell}>
                Get Started
              </button>
            </article>
          </div>
        </section>

        {/* Recent */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Recently Added</h2>
            <button className="filter-btn" aria-label="Filter" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {recent.length === 0 ? (
            <SkeletonGrid count={4} />
          ) : sortedRecent.length === 0 ? (
            <p className="muted" style={{ padding: 14 }}>No items match your filters.</p>
          ) : null}

          <div className="recent-grid">
            {sortedRecent.map((p, i) => (
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
      </main>

      <BottomNav />
    </div>
  );
}
