import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, ArrowLeft, X, PackageSearch } from 'lucide-react';
import { sbay } from '../api/client';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { SkeletonGrid } from '../components/Skeleton';
import './pages.css';
import './Search.css';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [q, setQ] = useState(initialQ);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load real categories from API
  useEffect(() => {
    sbay.getCategories().then((cats) => {
      setCategories(['All', ...cats.filter((c) => c.id !== 'all').map((c) => c.label)]);
    }).catch(() => {
      setCategories(['All']);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const catParam = filter !== 'All' ? filter.toLowerCase() : '';
    sbay.searchProducts(q, catParam).then((r) => {
      if (active) { setResults(r); setLoading(false); }
    });
    return () => { active = false; };
  }, [q, filter]);

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
        </div>
      </header>

      {categories.length > 1 && (
        <div className="filter-row">
          {categories.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <main className="page-main">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : results.length === 0 ? (
          <div className="empty">
            <div className="emo"><PackageSearch size={44} /></div>
            <h3>{q ? `No results for "${q}"` : 'Start typing to search'}</h3>
            <p>{q ? 'Try a different keyword or browse categories.' : 'Find anything from textbooks to electronics.'}</p>
            {q && (
              <button className="btn btn-ghost" onClick={() => navigate('/categories')}>
                Browse Categories
              </button>
            )}
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
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
}
