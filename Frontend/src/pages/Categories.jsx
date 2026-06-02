import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, X, MapPin, Building2, ChevronRight,
  ShoppingBag, GraduationCap, Store, Tag,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

/**
 * Categories / Schools browse page — Redesigned.
 *
 * Left sidebar: dynamic list of campuses from sellers (no "All Schools").
 *               "Others / Off Campus" appears last for non-student sellers.
 * Right pane:   when a campus is selected, shows categories grouped as
 *               sections with an "All Products" link + product thumbnails
 *               per category (like Jumia's category browse).
 */
export default function Categories() {
  const navigate  = useNavigate();
  const { catId } = useParams();

  /* ── data ── */
  const [schools,       setSchools]       = useState([]);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [selectedId,    setSelectedId]    = useState(catId || null);
  const [products,      setProducts]      = useState([]);
  const [prodLoading,   setProdLoading]   = useState(false);

  /* ── search ── */
  const [query, setQuery] = useState('');
  const prodInputRef = useRef(null);

  /* ── load schools from API (no "All Schools") ── */
  useEffect(() => {
    let alive = true;
    sbay.getSchoolTree()
      .then((tree) => {
        if (!alive) return;
        // Move "others" to the end; rename it
        const others = tree.filter((s) => s.id === 'others').map((s) => ({ ...s, label: 'Others / Off Campus' }));
        const rest   = tree.filter((s) => s.id !== 'others');
        const sorted = [...rest, ...others];
        setSchools(sorted);
        // Auto-select first school if nothing from URL
        if (!catId && sorted.length > 0) setSelectedId(sorted[0].id);
        setSchoolLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setSchools([]);
        setSchoolLoading(false);
      });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── sync URL param → state ── */
  useEffect(() => {
    if (catId && catId !== selectedId) setSelectedId(catId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  /* ── fetch products when school changes ── */
  const fetchProducts = useCallback((schoolId) => {
    if (!schoolId) return;
    setProdLoading(true);
    setQuery('');
    sbay.getProductsByScope({ schoolId })
      .then((items) => { setProducts(items); setProdLoading(false); })
      .catch(() => { setProducts([]); setProdLoading(false); });
  }, []);

  useEffect(() => { if (selectedId) fetchProducts(selectedId); }, [selectedId, fetchProducts]);

  /* ── navigation ── */
  const selectSchool = (id) => {
    setSelectedId(id);
    setQuery('');
    navigate(`/category/${id}`, { replace: true });
  };

  /* ── derived ── */
  const activeSchool = schools.find((s) => s.id === selectedId);

  // Group products by category for the main pane
  const categoryGroups = useMemo(() => {
    let list = products;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    const groups = new Map();
    for (const p of list) {
      const cat = p.category || 'Uncategorized';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(p);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [products, query]);

  const totalCount = categoryGroups.reduce((sum, [, items]) => sum + items.length, 0);
  const title = activeSchool?.label || 'Campus';

  return (
    <div className="cat-page">
      {/* Mobile top bar */}
      <div className="cat-top">
        <div className="cat-search">
          <Search size={16} className="cat-search-ic" />
          <input
            type="text"
            placeholder={`Search in ${title}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            ref={prodInputRef}
          />
          {query && (
            <button className="cat-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="cat-layout">
        {/* ── Sidebar: campus list ── */}
        <aside className="cat-sidebar">
          <div className="cat-sidebar-hd">
            <GraduationCap size={15} />
            <span>Campuses</span>
          </div>

          {schoolLoading ? (
            <div className="cat-list-skel">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="cat-item" style={{ opacity: 0.35 }}>
                  <div style={{ width: '65%', height: 11, background: 'var(--border)', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : (
            <ul className="cat-list" role="listbox" aria-label="Campuses">
              {schools.map((school) => {
                const isOthers = school.id === 'others';
                const active   = selectedId === school.id;
                return (
                  <li key={school.id}>
                    <button
                      className={`cat-item ${active ? 'active' : ''}`}
                      onClick={() => selectSchool(school.id)}
                      role="option"
                      aria-selected={active}
                    >
                      <span className="cat-item-ic">
                        {isOthers ? <Store size={14} /> : <GraduationCap size={14} />}
                      </span>
                      <span className="cat-label-wrap">
                        <span className="cat-label">{school.label}</span>
                        {school.city && !isOthers && (
                          <span className="cat-city">
                            <MapPin size={10} />{school.city}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={13} className={`cat-chev ${active ? 'active' : ''}`} />
                    </button>
                  </li>
                );
              })}
              {schools.length === 0 && (
                <li className="cat-empty">No campuses with listings yet</li>
              )}
            </ul>
          )}
        </aside>

        {/* ── Main content: category sections ── */}
        <main className="cat-main">
          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="cat-toolbar-left">
              <h1 className="cat-title">{title}</h1>
              {activeSchool?.city && (
                <p className="cat-subtitle">📍 {activeSchool.city}</p>
              )}
            </div>
            {!prodLoading && (
              <span className="cat-count">
                {totalCount} item{totalCount !== 1 ? 's' : ''}
              </span>
            )}
            <div className="cat-search cat-main-search">
              <Search size={15} className="cat-search-ic" />
              <input
                type="text"
                placeholder={`Search in ${title}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
              {query && (
                <button className="cat-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {prodLoading ? (
            <div className="cat-panel panel-skel">
              <div className="panel-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="panel-cell">
                    <div className="cell-thumb" style={{ background: 'var(--border)', opacity: 0.45 }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, opacity: 0.35, margin: '6px 0 4px' }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, opacity: 0.25, width: '60%' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedId || schools.length === 0 ? (
            <div className="cat-panel" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
              padding: '64px 24px', textAlign: 'center',
            }}>
              <GraduationCap size={48} color="var(--border-strong)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Select a campus</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', margin: 0, maxWidth: 320 }}>
                Choose a campus from the sidebar to browse products.
              </p>
            </div>
          ) : categoryGroups.length === 0 ? (
            <div className="cat-panel" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
              padding: '64px 24px', textAlign: 'center',
            }}>
              <Building2 size={48} color="var(--border-strong)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                {query ? `No results for "${query}"` : `No products at ${title} yet`}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', margin: 0, maxWidth: 320 }}>
                {query
                  ? 'Try a different search term or browse another campus.'
                  : 'Sellers from this campus will list their items here soon.'}
              </p>
              {query && (
                <button className="btn btn-ghost" onClick={() => setQuery('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="cat-panel cat-sections">
              {/* "All Products" link at top */}
              <div className="cat-section-hd">
                <h2>All Products</h2>
                <button
                  className="cat-see-all"
                  onClick={() => navigate(`/category/${selectedId}`)}
                >
                  {totalCount} items <ChevronRight size={14} />
                </button>
              </div>

              {categoryGroups.map(([catName, items]) => (
                <section key={catName} className="cat-section">
                  <div className="cat-section-hd">
                    <h2><Tag size={14} /> {catName}</h2>
                    <span className="cat-see-all-label">{items.length} items</span>
                  </div>
                  <div className="cat-section-grid">
                    {items.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        className="cat-section-card"
                        onClick={() => navigate(`/product/${p.id}`)}
                      >
                        <div
                          className="cat-section-thumb"
                          style={{ backgroundImage: `url(${p.image})` }}
                        />
                        <span className="cat-section-name">{p.title}</span>
                        <span className="cat-section-price">
                          GH₵ {p.price?.toLocaleString()}
                          {p.discountPrice && p.discountPrice > p.price && (
                            <span className="cell-was">GH₵ {p.discountPrice.toLocaleString()}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <Footer />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
