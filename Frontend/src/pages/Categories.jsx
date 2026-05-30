import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, MapPin, Tag, LayoutGrid } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { sbay } from '../api/client';
import { SkeletonGrid } from '../components/Skeleton';
import './pages.css';
import './Categories.css';

/**
 * Categories page.
 *
 * Sidebar: flat list of real seller-set categories fetched from the API.
 * Main:    product grid filtered by the selected category.
 */
export default function Categories() {
  const navigate = useNavigate();
  const { catId } = useParams();

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [selectedCat, setSelectedCat] = useState(catId || 'all');
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [catQuery, setCatQuery] = useState('');

  // Fetch categories from real seller data
  useEffect(() => {
    let alive = true;
    sbay.getCategories()
      .then((cats) => {
        if (!alive) return;
        setCategories(cats);
        setCatLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setCategories([{ id: 'all', label: 'All Items', icon: 'ShoppingBag' }]);
        setCatLoading(false);
      });
    return () => { alive = false; };
  }, []);

  // Sync URL param → state
  useEffect(() => {
    if (catId && catId !== selectedCat) setSelectedCat(catId);
  }, [catId]);

  // Fetch products when category changes
  const fetchProducts = useCallback((catSlug) => {
    setProdLoading(true);
    sbay.getProductsByCategory(catSlug === 'all' ? '' : catSlug)
      .then((items) => {
        setProducts(items);
        setProdLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setProdLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProducts(selectedCat);
  }, [selectedCat, fetchProducts]);

  const selectCat = (id) => {
    setSelectedCat(id);
    setQuery('');
    if (id === 'all') {
      navigate('/categories', { replace: true });
    } else {
      navigate(`/category/${id}`, { replace: true });
    }
  };

  const filteredCats = useMemo(() => {
    if (!catQuery.trim()) return categories;
    const q = catQuery.toLowerCase();
    return categories.filter((c) => c.label.toLowerCase().includes(q));
  }, [categories, catQuery]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [products, query]);

  const activeCat = categories.find((c) => c.id === selectedCat);
  const title = activeCat?.label || 'All Items';

  return (
    <div className="cat-page">
      {/* Mobile-only top bar */}
      <div className="cat-top">
        <div className="cat-search">
          <Search size={16} className="cat-search-ic" />
          <input
            type="text"
            placeholder={`Search in ${title}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          {query && (
            <button className="cat-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="cat-layout">
        {/* Sidebar */}
        <aside className="cat-sidebar">
          {/* Desktop sidebar search */}
          <div className="cat-sidebar-search">
            <Search size={14} className="cat-search-ic" />
            <input
              type="text"
              placeholder="Filter categories…"
              value={catQuery}
              onChange={(e) => setCatQuery(e.target.value)}
              aria-label="Filter categories"
            />
            {catQuery && (
              <button className="cat-search-clear" onClick={() => setCatQuery('')} aria-label="Clear">
                <X size={12} />
              </button>
            )}
          </div>

          {catLoading ? (
            <div style={{ padding: '12px 0' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="cat-item" style={{ opacity: 0.4 }}>
                  <div style={{ width: '70%', height: 12, background: 'var(--border)', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : (
            <ul className="cat-list" role="listbox" aria-label="Product categories">
              {filteredCats.map((cat) => (
                <li key={cat.id}>
                  <button
                    className={`cat-item ${selectedCat === cat.id ? 'active' : ''}`}
                    onClick={() => selectCat(cat.id)}
                    role="option"
                    aria-selected={selectedCat === cat.id}
                  >
                    <Tag size={13} style={{ flexShrink: 0 }} />
                    <span className="cat-label">{cat.label}</span>
                    {cat.count > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.68rem',
                        color: 'var(--text-soft)',
                        flexShrink: 0,
                      }}>
                        {cat.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {filteredCats.length === 0 && (
                <li className="cat-empty">No categories match "{catQuery}"</li>
              )}
            </ul>
          )}
        </aside>

        {/* Main content */}
        <main className="cat-main">
          <div className="cat-toolbar">
            <h1 className="cat-title">{title}</h1>
            {!prodLoading && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            )}
            {/* Desktop search inside main */}
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
                    <div className="cell-thumb" style={{ background: 'var(--border)', opacity: 0.5 }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, opacity: 0.4, margin: '4px 0 2px' }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, opacity: 0.3, width: '60%' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="cat-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 24px', textAlign: 'center' }}>
              <LayoutGrid size={44} color="var(--border-strong)" />
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>
                {query ? `No results for "${query}"` : 'No products in this category yet'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                {query ? 'Try a different search term.' : 'Sellers will add items here soon.'}
              </p>
            </div>
          ) : (
            <section className="cat-panel">
              <div className="panel-head">
                <h2 className="panel-head-title">{title}</h2>
              </div>
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
                    {(p.school || p.city) && (
                      <span className="cell-loc">
                        <MapPin size={10} />
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
