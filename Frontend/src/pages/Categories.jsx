import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, X, MapPin, Building2, ChevronRight, ChevronDown,
  ShoppingBag, GraduationCap, Store, Tag,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { sbay } from '../api/client';
import { SkeletonGrid } from '../components/Skeleton';
import './pages.css';
import './Categories.css';

/**
 * Categories / Schools browse page.
 *
 * Sidebar: real list of schools/campuses derived from seller listings.
 *          Sellers who registered as "Others" appear under an "Others" entry.
 *          Clicking a school instantly filters products from that school.
 * Main:    responsive product grid for the selected school.
 */
export default function Categories() {
  const navigate  = useNavigate();
  const { catId } = useParams();          // reuse same param for school id

  /* ── data ── */
  const [schools,     setSchools]     = useState([]);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [selectedId,  setSelectedId]  = useState(catId || 'all');
  const [products,    setProducts]    = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  /* ── search / filter ── */
  const [query,         setQuery]       = useState('');
  const [schoolQ,       setSchoolQ]     = useState('');
  const [selectedCat,   setSelectedCat] = useState(null); // category id within current school

  const prodInputRef = useRef(null);

  /* ── load schools from API ── */
  useEffect(() => {
    let alive = true;
    sbay.getSchoolTree()
      .then((tree) => {
        if (!alive) return;
        // Prepend "All Schools" entry
        const all = { id: 'all', label: 'All Schools', city: '', categories: [], count: null };
        setSchools([all, ...tree]);
        setSchoolLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setSchools([{ id: 'all', label: 'All Schools', city: '', categories: [] }]);
        setSchoolLoading(false);
      });
    return () => { alive = false; };
  }, []);

  /* ── sync URL param → state ── */
  useEffect(() => {
    if (catId && catId !== selectedId) setSelectedId(catId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  /* ── fetch products when school changes ── */
  const fetchProducts = useCallback((schoolId) => {
    setProdLoading(true);
    setQuery('');
    sbay.getProductsByScope({ schoolId: schoolId === 'all' ? '' : schoolId })
      .then((items) => {
        setProducts(items);
        setProdLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setProdLoading(false);
      });
  }, []);

  useEffect(() => { fetchProducts(selectedId); }, [selectedId, fetchProducts]);

  /* ── navigation ── */
  const selectSchool = (id) => {
    setSelectedId(id);
    setSelectedCat(null);
    setSchoolQ('');
    if (id === 'all') navigate('/categories', { replace: true });
    else navigate(`/category/${id}`, { replace: true });
  };

  const selectCategory = (catId) => {
    setSelectedCat((prev) => prev === catId ? null : catId);
  };

  /* ── derived ── */
  const filteredSchools = useMemo(() => {
    if (!schoolQ.trim()) return schools;
    const q = schoolQ.toLowerCase();
    return schools.filter((s) =>
      s.label.toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  }, [schools, schoolQ]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCat) {
      const cat = selectedCat.toLowerCase();
      list = list.filter((p) => (p.category || '').toLowerCase() === cat ||
        (p.categoryId || '').toLowerCase() === cat);
    }
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [products, query, selectedCat]);

  const activeSchool = schools.find((s) => s.id === selectedId);
  const title = activeSchool?.id === 'all'
    ? 'All Schools'
    : activeSchool?.label || 'Campus';

  const subtitle = activeSchool?.id !== 'all' && activeSchool?.city
    ? `📍 ${activeSchool.city}`
    : null;

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
        {/* ── Sidebar ── */}
        <aside className="cat-sidebar">
          <div className="cat-sidebar-hd">
            <GraduationCap size={15} />
            <span>Schools &amp; Campuses</span>
          </div>

          {/* Sidebar school search */}
          <div className="cat-sidebar-search">
            <Search size={13} className="cat-search-ic" />
            <input
              type="text"
              placeholder="Find a school…"
              value={schoolQ}
              onChange={(e) => setSchoolQ(e.target.value)}
              aria-label="Filter schools"
            />
            {schoolQ && (
              <button className="cat-search-clear" onClick={() => setSchoolQ('')} aria-label="Clear">
                <X size={11} />
              </button>
            )}
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
            <ul className="cat-list" role="listbox" aria-label="Schools">
              {filteredSchools.map((school) => {
                const isOthers  = school.id === 'others';
                const isAll     = school.id === 'all';
                const active    = selectedId === school.id;
                const hasCats   = !isAll && school.categories?.length > 0;
                return (
                  <li key={school.id}>
                    <button
                      className={`cat-item ${active ? 'active' : ''}`}
                      onClick={() => selectSchool(school.id)}
                      role="option"
                      aria-selected={active}
                    >
                      <span className="cat-item-ic">
                        {isAll     ? <ShoppingBag size={14} /> :
                         isOthers  ? <Store size={14} />       :
                                     <GraduationCap size={14} />}
                      </span>
                      <span className="cat-label-wrap">
                        <span className="cat-label">{school.label}</span>
                        {school.city && !isAll && !isOthers && (
                          <span className="cat-city">
                            <MapPin size={10} />{school.city}
                          </span>
                        )}
                      </span>
                      {hasCats
                        ? <ChevronDown size={13} className={`cat-chev ${active ? 'active' : ''}`} />
                        : <ChevronRight size={13} className={`cat-chev ${active ? 'active' : ''}`} />}
                    </button>

                    {/* Category sub-items — visible only when this school is active */}
                    {active && hasCats && (
                      <ul className="cat-sub-list" role="listbox" aria-label={`${school.label} categories`}>
                        <li>
                          <button
                            className={`cat-sub-item ${!selectedCat ? 'active' : ''}`}
                            onClick={() => setSelectedCat(null)}
                          >
                            <ShoppingBag size={12} />
                            <span>All categories</span>
                            <span className="cat-sub-count">{products.length}</span>
                          </button>
                        </li>
                        {school.categories.map((cat) => {
                          const catActive = selectedCat === cat.id;
                          return (
                            <li key={cat.id}>
                              <button
                                className={`cat-sub-item ${catActive ? 'active' : ''}`}
                                onClick={() => selectCategory(cat.id)}
                              >
                                <Tag size={12} />
                                <span>{cat.label}</span>
                                {cat.count != null && (
                                  <span className="cat-sub-count">{cat.count}</span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
              {filteredSchools.length === 0 && (
                <li className="cat-empty">No schools match &quot;{schoolQ}&quot;</li>
              )}
            </ul>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="cat-main">
          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="cat-toolbar-left">
              <h1 className="cat-title">
                {title}
                {selectedCat && activeSchool?.categories?.find((c) => c.id === selectedCat) && (
                  <span className="cat-active-cat">
                    &nbsp;›&nbsp;{activeSchool.categories.find((c) => c.id === selectedCat)?.label}
                    <button className="cat-clear-cat" onClick={() => setSelectedCat(null)} aria-label="Clear category">
                      <X size={11} />
                    </button>
                  </span>
                )}
              </h1>
              {subtitle && <p className="cat-subtitle">{subtitle}</p>}
            </div>
            {!prodLoading && (
              <span className="cat-count">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            )}
            {/* Desktop inline search */}
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
          ) : filteredProducts.length === 0 ? (
            <div className="cat-panel" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
              padding: '64px 24px', textAlign: 'center',
            }}>
              <Building2 size={48} color="var(--border-strong)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                {query ? `No results for "${query}"` : `No products listed at ${title} yet`}
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
            <section className="cat-panel">
              <div className="panel-grid">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="panel-cell"
                    onClick={() => navigate(`/product/${p.id}`)}
                    aria-label={p.title}
                  >
                    <div
                      className="cell-thumb"
                      style={{ backgroundImage: `url(${p.image})` }}
                      role="img"
                      aria-label={p.title}
                    />
                    <span className="cell-label">{p.title}</span>
                    <span className="cell-price">GH₵ {p.price?.toLocaleString()}</span>
                    {p.category && (
                      <span className="cell-cat">{p.category}</span>
                    )}
                    {(p.school || p.city) && (
                      <span className="cell-loc">
                        <MapPin size={9} />
                        {p.school}{p.city ? `, ${p.city}` : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          <Footer />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
