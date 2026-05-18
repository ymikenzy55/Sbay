import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search as SearchIcon, X, ChevronRight, ArrowLeft, Package } from 'lucide-react';
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
  const [treeLoading, setTreeLoading] = useState(true);
  /* Sidebar view mode:
     - 'schools'    → show list of schools
     - 'categories' → show categories for the currently-selected school */
  const [sideView, setSideView] = useState('schools');
  const [scope, setScope] = useState({ schoolId: null, categoryId: null });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setTreeLoading(true);
    sbay.getSchoolTree()
      .then((data) => {
        if (active) setTree(data || []);
      })
      .finally(() => {
        if (active) setTreeLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // If the route carries a legacy /category/:catId, pre-select that category
  // across all schools so the user still lands on relevant products.
  useEffect(() => {
    if (catId && catId !== 'all') {
      setScope({ schoolId: null, categoryId: catId });
      setSideView('schools');
    }
  }, [catId]);

  // Fetch products for the current scope (school + category).
  useEffect(() => {
    let active = true;
    setProductsLoading(true);
    sbay.getProductsByScope(scope)
      .then((data) => {
        if (active) setProducts(data || []);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [scope.schoolId, scope.categoryId]);

  const activeSchool = tree.find((s) => s.id === scope.schoolId);
  const activeCat = activeSchool?.categories.find((c) => c.id === scope.categoryId);

  const heading = activeSchool
    ? (activeCat ? `${activeCat.label} · ${activeSchool.label}` : activeSchool.label)
    : (scope.categoryId ? scope.categoryId.replace(/^./, (c) => c.toUpperCase()) : 'All Products');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  const selectSchool = (sid) => {
    setScope({ schoolId: sid, categoryId: null });
    setSideView('categories');
  };
  const selectCategory = (cid) => {
    setScope((s) => ({ ...s, categoryId: cid }));
  };
  const backToSchools = () => {
    setSideView('schools');
    setScope({ schoolId: null, categoryId: null });
  };

  return (
    <div className="page cat-page">
      {/* Custom top bar: logo + live-search input shifted left */}
      <header className="cat-top">
        <button className="cat-brand" onClick={() => navigate('/home')} aria-label="Home">
          <Logo size="md" />
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
        {/* Two-level sidebar: schools → categories of the selected school */}
        <aside className="cat-sidebar" aria-label="Schools and categories">
          {treeLoading ? (
            <div className="cat-side-skel">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} h={36} r={6} style={{ display: 'block', margin: '6px 4px' }} />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <div className="empty cat-empty-state">
              <div className="emo"><Package size={36} /></div>
              <h3>No categories yet</h3>
              <p className="muted">There are no active listings in the database yet.</p>
            </div>
          ) : sideView === 'schools' ? (
            <ul className="school-list">
              <li className="side-section-label">Schools</li>
              {tree.map((s) => {
                const isActive = scope.schoolId === s.id;
                return (
                  <li key={s.id} className={`school-item ${isActive ? 'active' : ''}`}>
                    <button className="school-head" onClick={() => selectSchool(s.id)}>
                      <span className="school-label">{s.label}</span>
                      {s.city && <span className="school-city">{s.city}</span>}
                      <ChevronRight size={14} className="school-chev" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="school-list">
              <li>
                <button className="side-back" onClick={backToSchools}>
                  <ArrowLeft size={14} /> Schools
                </button>
              </li>
              <li className="side-section-label">
                {activeSchool?.label}
              </li>
              {activeSchool && activeSchool.categories.length === 0 ? (
                <li className="cat-empty">No categories yet</li>
              ) : (
                activeSchool?.categories.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`cat-sub ${scope.categoryId === c.id ? 'active' : ''}`}
                      onClick={() => selectCategory(c.id)}
                    >
                      <CatIcon name={c.icon} size={14} />
                      <span>{c.label}</span>
                    </button>
                  </li>
                ))
              )}
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
                onClick={() => { setScope({ schoolId: null, categoryId: null }); setSideView('schools'); }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {productsLoading ? (
            <div className="panel-skel">
              <Skeleton w={160} h={20} />
              <div className="panel-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h={120} r={10} />
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="emo"><Package size={44} /></div>
              <h3>No products yet</h3>
              <p className="muted">
                {query.trim()
                  ? 'Try a different school, category, or search term.'
                  : 'There are no listings for this category yet.'}
              </p>
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
