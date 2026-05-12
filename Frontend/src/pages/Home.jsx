import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Heart, Shield, MapPin } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import FilterDrawer from '../components/FilterDrawer';
import { sbay } from '../api/client';
import { SkeletonGrid, Skeleton } from '../components/Skeleton';
import './Home.css';

const FILTER_DEFAULT = { universities: [], priceMin: 0, priceMax: 10000 };

export default function Home() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [trending, setTrending] = useState([]);
  const [sellers,  setSellers]  = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [saved, setSaved] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(FILTER_DEFAULT);

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

  // Apply both filter chips and the search query to a product list.
  const applyFilters = (list) => list.filter((p) => {
    if (filter.universities.length && !filter.universities.includes(p.universityId)) return false;
    if (p.price < filter.priceMin || p.price > filter.priceMax) return false;
    return true;
  });

  const q = query.trim().toLowerCase();
  const filteredTrending = useMemo(() => applyFilters(trending), [trending, filter]);
  const filteredRecent   = useMemo(() => applyFilters(recent),   [recent,   filter]);

  const matches = useMemo(() => {
    if (!q) return null;
    return applyFilters([...trending, ...recent]).filter((p) =>
      p.title.toLowerCase().includes(q)
    );
  }, [q, trending, recent, filter]);

  const featuredSellers = sellers.slice(0, 2);
  const filterActiveCount =
    filter.universities.length +
    (filter.priceMin !== FILTER_DEFAULT.priceMin ? 1 : 0) +
    (filter.priceMax !== FILTER_DEFAULT.priceMax ? 1 : 0);

  return (
    <div className="home">
      <TopBar
        hideActions
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search phones, books, sneakers, snacks..."
      />

      {/* Filter row */}
      <div className="home-filter-row">
        <FilterDrawer
          value={filter}
          onApply={setFilter}
          onReset={() => setFilter(FILTER_DEFAULT)}
          label="Filter"
        />
        {filterActiveCount > 0 && (
          <button className="filter-clear" onClick={() => setFilter(FILTER_DEFAULT)}>
            Clear filters
          </button>
        )}
        <span className="filter-hint muted small">
          {filter.universities.length > 0 &&
            `${filter.universities.length} school${filter.universities.length === 1 ? '' : 's'}`}
          {filter.priceMax !== FILTER_DEFAULT.priceMax &&
            ` · up to GH₵ ${filter.priceMax.toLocaleString()}`}
        </span>
      </div>

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
                <p className="muted">Try a different keyword or remove some filters.</p>
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
        ) : (
          <>
            {/* Trending */}
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Trending on Campus</h2>
                <button className="view-all" onClick={() => navigate('/trending')}>
                  View all <ArrowRight size={14} />
                </button>
              </div>

              {trending.length === 0 && <SkeletonGrid count={3} />}
              <div className="trend-scroller">
                {filteredTrending.map((p, i) => (
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
                      <p className="prod-meta">
                        <MapPin size={12} /> {p.campus}{p.location ? ` · ${p.location}` : ''}
                      </p>
                    </div>
                  </motion.article>
                ))}
                {filteredTrending.length === 0 && trending.length > 0 && (
                  <div className="empty-inline">No trending items match your filters.</div>
                )}
              </div>
            </section>

            {/* Sellers */}
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
                {filteredRecent.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    i={i}
                    saved={saved[p.id]}
                    toggleSave={toggleSave}
                    onClick={() => navigate(`/product/${p.id}`)}
                  />
                ))}
                {filteredRecent.length === 0 && recent.length > 0 && (
                  <div className="empty-inline">No recent items match your filters.</div>
                )}
              </div>
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
          <span>{p.campus}{p.location ? ` · ${p.location}` : ''}</span>
        </p>
      </div>
    </motion.article>
  );
}
