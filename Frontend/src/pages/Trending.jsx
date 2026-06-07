import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Flame, Globe } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import CampusBanner from '../components/CampusBanner';
import { SkeletonGrid } from '../components/Skeleton';
import { sbay } from '../api/client';
import { useLocation as useCampus } from '../store/LocationContext';
import './pages.css';
import './Trending.css';

export default function Trending() {
  const navigate = useNavigate();
  const { campus } = useCampus();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([sbay.getTrending(), sbay.getRecent()]).then(([t, r]) => {
      if (!active) return;
      const trending = t.status === 'fulfilled' ? t.value : [];
      const recent = r.status === 'fulfilled' ? r.value : [];
      // Deduplicate by product id
      const seen = new Set();
      const merged = [];
      for (const p of [...trending, ...recent]) {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      }
      setItems(merged);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const localItems = useMemo(() => {
    if (!campus) return [];
    const school = campus.label.toLowerCase();
    const city   = (campus.city || '').toLowerCase();
    return items.filter((p) => {
      const ps = (p.school || '').toLowerCase();
      const pc = (p.city   || '').toLowerCase();
      return ps.includes(school) || school.includes(ps) ||
             (city && (pc.includes(city) || city.includes(pc)));
    });
  }, [campus, items]);

  const displayed = campus && !showAll ? localItems : items;

  return (
    <div className="page">
      <TopBar showBack title="Trending" />
      <CampusBanner />

      <main className="page-main">
        <div className="trend-banner">
          <TrendingUp size={28} />
          <div>
            <h2>What’s hot on campus</h2>
            <p className="muted small">
              {campus ? `Showing items near ${campus.label}` : 'Most viewed and purchased items this week'}
            </p>
          </div>
          {campus && (
            <button
              className="btn btn-ghost"
              style={{ marginLeft: 'auto', fontSize: '.8rem', padding: '6px 12px' }}
              onClick={() => setShowAll((v) => !v)}
            >
              <Globe size={14} />
              {showAll ? `Near ${campus.label}` : 'All campuses'}
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : displayed.length === 0 ? (
          <div className="empty">
            <div className="emo"><Flame size={44} /></div>
            <h3>{campus && !showAll ? `No trending items at ${campus.label} yet` : 'No trending products yet'}</h3>
            <p className="muted">
              {campus && !showAll
                ? 'Try switching to all campuses to browse other listings.'
                : 'There are no listings in the database yet, so nothing can trend right now.'}
            </p>
            {campus && !showAll && (
              <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowAll(true)}>
                <Globe size={14} /> View all campuses
              </button>
            )}
          </div>
        ) : (
          <div className="trending-full-grid">
            {displayed.map((p, i) => (
              <motion.article
                key={p.id}
                className="result-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="result-img" style={{ backgroundImage: `url(${p.image})` }} />
                <div className="result-body">
                  <h4 className="prod-title">{p.title}</h4>
                  <span className="price">
                    GH₵ {p.price.toLocaleString()}
                    {p.discountPrice && p.discountPrice > p.price && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 4, fontWeight: 400 }}>
                        GH₵ {p.discountPrice.toLocaleString()}
                      </span>
                    )}
                  </span>
                  {(p.school || p.city) && (
                    <p className="prod-loc">
                      <MapPin size={12} />
                      <span>{p.school}{p.city ? `, ${p.city}` : ''}</span>
                    </p>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
