import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Flame } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SkeletonGrid } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Trending.css';

export default function Trending() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([sbay.getTrending(), sbay.getRecent()]).then(([t, r]) => {
      if (!active) return;
      const trending = t.status === 'fulfilled' ? t.value : [];
      const recent = r.status === 'fulfilled' ? r.value : [];
      setItems([...trending, ...recent]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <TopBar showBack title="Trending" />

      <main className="page-main">
        <div className="trend-banner">
          <TrendingUp size={28} />
          <div>
            <h2>What's hot on campus</h2>
            <p className="muted small">Most viewed and purchased items this week</p>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="emo"><Flame size={44} /></div>
            <h3>No trending products yet</h3>
            <p className="muted">There are no listings in the database yet, so nothing can trend right now.</p>
          </div>
        ) : (
          <div className="trending-full-grid">
            {items.map((p, i) => (
              <motion.article
                key={p.id}
                className="result-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="result-img" style={{ backgroundImage: `url(${p.image})` }}>
                  <span className="rank">#{i + 1}</span>
                </div>
                <div className="result-body">
                  <h4 className="prod-title">{p.title}</h4>
                  <span className="price">GH₵ {p.price.toLocaleString()}</span>
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

      <BottomNav />
    </div>
  );
}
