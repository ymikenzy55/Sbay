import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, X, MapPin, ChevronRight, ChevronLeft,
  ShoppingBag, GraduationCap, Store, Tag, Layers,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

/**
 * Categories page — Redesigned with two-level sidebar navigation.
 *
 * 1. User lands → sees ALL categories (all products grid).
 * 2. Sidebar shows list of schools/campuses.
 * 3. Clicking a school slides open a sub-panel WITHIN the sidebar
 *    showing that school's categories.
 * 4. Selecting a category from the sub-panel filters the main grid.
 * 5. "All items" option in sub-panel shows all products for that school.
 */
export default function Categories() {
  const navigate  = useNavigate();
  const { catId } = useParams();

  /* ── data ── */
  const [schools,       setSchools]       = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [products,      setProducts]      = useState([]);
  const [prodLoading,   setProdLoading]   = useState(false);

  /* ── sidebar state ── */
  const [activeSchool, setActiveSchool]     = useState(null); // school object or null
  const [activeCat,    setActiveCat]        = useState(null); // category id or null
  const [sidebarView,  setSidebarView]      = useState('schools'); // 'schools' | 'categories'

  /* ── search ── */
  const [query, setQuery] = useState('');
  const prodInputRef = useRef(null);

  /* ── load schools from API ── */
  useEffect(() => {
    let alive = true;
    sbay.getSchoolTree()
      .then((tree) => {
        if (!alive) return;
        const others = tree.filter((s) => s.id === 'others').map((s) => ({ ...s, label: 'Others / Off Campus' }));
        const rest   = tree.filter((s) => s.id !== 'others');
        const sorted = [...rest, ...others];
        setSchools(sorted);
        // Collect all unique categories across all schools
        const catMap = new Map();
        for (const s of sorted) {
          for (const c of (s.categories || [])) {
            const existing = catMap.get(c.id);
            if (existing) existing.count += c.count;
            else catMap.set(c.id, { ...c });
          }
        }
        setAllCategories(Array.from(catMap.values()).sort((a, b) => b.count - a.count));
        setSchoolLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setSchools([]);
        setSchoolLoading(false);
      });
    return () => { alive = false; };
  }, []);

  /* ── fetch products based on current filters ── */
  const fetchProducts = useCallback((schoolId, categoryId) => {
    setProdLoading(true);
    setQuery('');
    const scope = {};
    if (schoolId) scope.schoolId = schoolId;
    if (categoryId) scope.categoryId = categoryId;

    const fetcher = schoolId
      ? sbay.getProductsByScope(scope)
      : categoryId
        ? sbay.getProductsByCategory(categoryId)
        : sbay.getAllProducts({ limit: 60 });

    fetcher
      .then((items) => { setProducts(items); setProdLoading(false); })
      .catch(() => { setProducts([]); setProdLoading(false); });
  }, []);

  /* ── initial load: show all products ── */
  useEffect(() => {
    if (!schoolLoading && !catId) {
      fetchProducts(null, null);
    }
  }, [schoolLoading, catId, fetchProducts]);

  /* ── sync URL param ── */
  useEffect(() => {
    if (catId && schools.length) {
      // catId could be a school id or category id
      const school = schools.find((s) => s.id === catId);
      if (school) {
        setActiveSchool(school);
        setSidebarView('categories');
        setActiveCat(null);
        fetchProducts(school.id, null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId, schools]);

  /* ── sidebar actions ── */
  const openSchool = (school) => {
    setActiveSchool(school);
    setSidebarView('categories');
    setActiveCat(null);
    setQuery('');
    fetchProducts(school.id, null);
    navigate(`/category/${school.id}`, { replace: true });
  };

  const selectCategory = (catId) => {
    setActiveCat(catId);
    setQuery('');
    fetchProducts(activeSchool?.id || null, catId);
  };

  const selectAllInSchool = () => {
    setActiveCat(null);
    setQuery('');
    fetchProducts(activeSchool?.id || null, null);
  };

  const goBackToSchools = () => {
    setSidebarView('schools');
    setActiveSchool(null);
    setActiveCat(null);
    setQuery('');
    fetchProducts(null, null);
    navigate('/categories', { replace: true });
  };

  /* ── derived ── */
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [products, query]);

  // Group products by category for the main pane
  const categoryGroups = useMemo(() => {
    const groups = new Map();
    for (const p of filteredProducts) {
      const cat = p.category || 'Uncategorized';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(p);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredProducts]);

  const totalCount = filteredProducts.length;
  const title = activeCat
    ? (activeSchool?.categories?.find((c) => c.id === activeCat)?.label || activeCat)
    : activeSchool
      ? activeSchool.label
      : 'All Categories';

  return (
    <div className="cat-page">
      {/* Mobile top bar */}
      <div className="cat-top">
        <div className="cat-search">
          <Search size={16} className="cat-search-ic" />
          <input
            type="text"
            placeholder={`Search products…`}
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
          {sidebarView === 'schools' ? (
            <>
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
                    return (
                      <li key={school.id}>
                        <button
                          className="cat-item"
                          onClick={() => openSchool(school)}
                          role="option"
                          aria-selected={false}
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
                          <ChevronRight size={13} className="cat-chev" />
                        </button>
                      </li>
                    );
                  })}
                  {schools.length === 0 && (
                    <li className="cat-empty">No campuses with listings yet</li>
                  )}
                </ul>
              )}
            </>
          ) : (
            <>
              {/* Sub-panel: categories within the selected school */}
              <div className="cat-sidebar-hd cat-sidebar-back">
                <button className="cat-back-btn" onClick={goBackToSchools}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              </div>

              <div className="cat-school-title">
                <GraduationCap size={14} />
                <span>{activeSchool?.label}</span>
                {activeSchool?.city && (
                  <span className="cat-school-city"><MapPin size={9} />{activeSchool.city}</span>
                )}
              </div>

              <ul className="cat-list" role="listbox" aria-label="Categories">
                {/* "All items" option */}
                <li>
                  <button
                    className={`cat-sub-item ${!activeCat ? 'active' : ''}`}
                    onClick={selectAllInSchool}
                    role="option"
                    aria-selected={!activeCat}
                  >
                    <span>All Items</span>
                    <span className="cat-sub-count">
                      {(activeSchool?.categories || []).reduce((s, c) => s + c.count, 0)}
                    </span>
                  </button>
                </li>
                {(activeSchool?.categories || []).map((cat) => (
                  <li key={cat.id}>
                    <button
                      className={`cat-sub-item ${activeCat === cat.id ? 'active' : ''}`}
                      onClick={() => selectCategory(cat.id)}
                      role="option"
                      aria-selected={activeCat === cat.id}
                    >
                      <span>{cat.label}</span>
                      <span className="cat-sub-count">{cat.count}</span>
                    </button>
                  </li>
                ))}
                {(activeSchool?.categories || []).length === 0 && (
                  <li className="cat-empty">No categories yet</li>
                )}
              </ul>
            </>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="cat-main">
          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="cat-toolbar-left">
              <h1 className="cat-title">{title}</h1>
              {activeSchool && activeCat && (
                <p className="cat-subtitle">
                  {activeSchool.label}
                  <button className="cat-clear-cat" onClick={selectAllInSchool} aria-label="Clear category filter">
                    <X size={10} />
                  </button>
                </p>
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
          ) : filteredProducts.length === 0 ? (
            <div className="cat-panel cat-empty-state">
              <ShoppingBag size={48} color="var(--border-strong)" />
              <h3>
                {query ? `No results for "${query}"` : 'No products found'}
              </h3>
              <p>
                {query
                  ? 'Try a different search term.'
                  : activeSchool
                    ? `No sellers have listed items${activeCat ? ' in this category' : ''} at ${activeSchool.label} yet.`
                    : 'Browse a campus from the sidebar to discover products.'}
              </p>
              {query && (
                <button className="btn btn-ghost" onClick={() => setQuery('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="cat-panel cat-sections">
              {categoryGroups.map(([catName, items]) => (
                <section key={catName} className="cat-section">
                  <div className="cat-section-hd">
                    <h2><Tag size={14} /> {catName}</h2>
                    <span className="cat-see-all-label">{items.length} item{items.length !== 1 ? 's' : ''}</span>
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
