import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, ArrowLeft, Mic, X } from 'lucide-react';
import { sbay } from '../api/client';
import BottomNav from '../components/BottomNav';
import { SkeletonGrid } from '../components/Skeleton';
import './pages.css';
import './Search.css';

const FILTERS = ['All', 'Electronics', 'Fashion', 'Books', 'Sports', 'Beauty'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    sbay.searchProducts(q).then((r) => {
      if (active) { setResults(r); setLoading(false); }
    });
    return () => { active = false; };
  }, [q]);

  return (
    <div className="page">
      <header className="search-top">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="search-input-wrap">
          <SearchIcon size={18} className="leading" />
          <input
            autoFocus
            placeholder="Search campus deals..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="clear" onClick={() => setQ('')} aria-label="Clear">
              <X size={16} />
            </button>
          )}
          <button className="mic" aria-label="Voice"><Mic size={18} /></button>
        </div>
      </header>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <main className="page-main">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : results.length === 0 ? (
          <div className="empty">
            <div className="emo">🤷🏾‍♂️</div>
            <h3>No results found</h3>
            <p>Try a different keyword or campus.</p>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((p, i) => (
              <motion.article
                key={p.id}
                className="result-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="result-img" style={{ backgroundImage: `url(${p.image})` }} />
                <div className="result-body">
                  <h4 className="prod-title">{p.title}</h4>
                  <span className="price">GH₵ {p.price.toLocaleString()}</span>
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
