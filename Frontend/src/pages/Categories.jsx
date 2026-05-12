import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search as SearchIcon, X, ChevronDown, ChevronRight, Package } from 'lucide-react';
import * as Lucide from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import { Skeleton } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

function CatIcon({ name, size = 18 }) {
  const Icon = Lucide[name] || Lucide.Tag;
  return <Icon size={size} />;
}

export default function Categories() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [scope, setScope] = useState({ schoolId: null, categoryId: null });
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState('');

  // Load sidebar tree.
  useEffect(() => { sbay.getSchoolTree().then(setTree); }, []);

  // If the route carries a legacy /category/:catId, pre-select that category
  // across all schools so the user still lands on relevant products.
  useEffect(() => {
    if (catId && catId !== 'all') {
      setScope({ schoolId: null, categoryId: catId });
    }
  }, [catId]);

  // Fetch products for the current scope (school + category).
  useEffect(() => {
    setProducts(null);
    sbay.getProductsByScope(scope).then(setProducts);
  }, [scope.schoolId, scope.categoryId]);

  const activeSchool = tree.find((s) => s.id === scope.schoolId);
  const activeCat    = activeSchool?.categories.find((c) => c.id === scope.categoryId);

  const heading = activeSchool
    ? (activeCat ? `${activeCat.label} · ${activeSchool.label}` : activeSchool.label)
    : (scope.categoryId ? scope.categoryId.replace(/^./, (c) => c.toUpperCase()) : 'All Products');

  const filtered = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  const selectSchool = (sid) => {
    setExpanded((cur) => (cur === sid ? null : sid));
    setScope({ schoolId: sid, categoryId: null });
  };
  const selectCategory = (sid, cid) => {
    setScope({ schoolId: sid, categoryId: cid });
  };

  return (
    <div className="page cat-page">
      {/* Custom top bar: logo + live-search input shifted left */}
      <header className="cat-top">
        <button className="cat-brand" onClick={() => navigate('/home')} aria-label="Home">
          <Logo size="sm" />
        </button>
        <div className="cat-search">
          <SearchIcon size={16} className="cat-search-ic" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within this page..."
            aria-label="Search within categories"
          />
          {query && (
            <button className="cat-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="cat-layout">
        {/* School tree sidebar */}
        <aside className="cat-sidebar" aria-label="Schools">
          {tree.length === 0 ? (
            <div className="cat-side-skel">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} h={36} r={6} style={{ display: 'block', margin: '6px 4px' }} />
              ))}
            </div>
          ) : (
            <ul className="school-list">
              {tree.map((s) => {
                const isOpen = expanded === s.id;
                const isActiveSchool = scope.schoolId === s.id;
                return (
                  <li key={s.id} className={`school-item ${isActiveSchool ? 'active' : ''}`}>
                    <button
                      className="school-head"
                      onClick={() => selectSchool(s.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="school-label">{s.label}</span>
                      {s.city && <span className="school-city">{s.city}</span>}
                    </button>
                    {isOpen && (
                      <ul className="school-cats">
                        {s.categories.length === 0 ? (
                          <li className="cat-empty">No categories yet</li>
                        ) : (
                          s.categories.map((c) => (
                            <li key={c.id}>
                              <button
                                className={`cat-sub ${scope.schoolId === s.id && scope.categoryId === c.id ? 'active' : ''}`}
                                onClick={() => selectCategory(s.id, c.id)}
                              >
                                <CatIcon name={c.icon} size={14} />
                                <span>{c.label}</span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main */}
        <main className="cat-main">
          <div className="cat-toolbar">
            <h2 className="cat-title">{heading}</h2>
            {(scope.schoolId || scope.categoryId) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setScope({ schoolId: null, categoryId: null }); setExpanded(null); }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {products === null ? (
            <div className="panel-skel">
              <Skeleton w={160} h={20} />
              <div className="panel-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h={120} r={10} />
                ))}
              </div>
            </div>
          ) : filtered?.length === 0 ? (
            <div className="empty">
              <div className="emo"><Package size={44} /></div>
              <h3>No items match</h3>
              <p className="muted">Try a different school, category, or search term.</p>
            </div>
          ) : (
            <section className="cat-panel">
              <div className="panel-grid">
                {filtered.map((p, i) => (
                  <motion.button
                    key={p.id}
                    className="panel-cell"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="cell-thumb" style={{ backgroundImage: `url(${p.image})` }} />
                    <span className="cell-label">{p.title}</span>
                    <span className="cell-price">GH₵ {p.price.toLocaleString()}</span>
                    <span className="cell-loc">
                      <MapPin size={10} /> {p.school}{p.city ? `, ${p.city}` : ''}
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
