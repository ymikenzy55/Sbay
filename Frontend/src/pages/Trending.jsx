import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SkeletonGrid } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Trending.css';

export default function Trending() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => {
    // Combine trending + recent for a full trending feed.
    Promise.all([sbay.getTrending(), sbay.getRecent()]).then(([t, r]) =>
      setItems([...t, ...r])
    );
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

        {items === null ? (
          <SkeletonGrid count={8} />
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
