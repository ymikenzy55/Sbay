import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import * as Lucide from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import FilterDrawer from '../components/FilterDrawer';
import { Skeleton } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

const FILTER_DEFAULT = { universities: [], priceMin: 0, priceMax: 10000 };

function CatIcon({ name, size = 18 }) {
  const Icon = Lucide[name] || Lucide.Tag;
  return <Icon size={size} />;
}

export default function Categories() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState(null);
  const [filter, setFilter]         = useState(FILTER_DEFAULT);
  const activeId = catId || 'all';

  useEffect(() => { sbay.getCategories().then(setCategories); }, []);
  useEffect(() => {
    setProducts(null);
    sbay.getProductsByCategory(activeId).then(setProducts);
  }, [activeId]);

  const activeCat = categories.find((c) => c.id === activeId);

  const filtered = useMemo(() => {
    if (!products) return null;
    return products.filter((p) => {
      if (filter.universities.length && !filter.universities.includes(p.universityId)) return false;
      if (p.price < filter.priceMin || p.price > filter.priceMax) return false;
      return true;
    });
  }, [products, filter]);

  const panels = useMemo(() => {
    if (!filtered) return [];
    if (filtered.length === 0) return [];
    const chunks = [];
    const labels = ['Top Picks', 'New Arrivals', 'Under GH₵ 1,000', 'Most Loved'];
    let i = 0;
    let l = 0;
    while (i < filtered.length && l < labels.length) {
      const next = filtered.slice(i, i + 6);
      if (next.length === 0) break;
      chunks.push({ label: labels[l], items: next });
      i += 6;
      l += 1;
    }
    if (chunks.length === 0) chunks.push({ label: 'All items', items: filtered });
    return chunks;
  }, [filtered]);

  return (
    <div className="page cat-page">
      <TopBar showBack title="Categories" />

      <div className="cat-layout">
        {/* Independently-scrolling sidebar */}
        <aside className="cat-sidebar" aria-label="Categories">
          {categories.length === 0 ? (
            <div className="cat-side-skel">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} h={36} r={6} style={{ display: 'block', margin: '6px 4px' }} />
              ))}
            </div>
          ) : (
            <ul className="cat-list">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    className={`cat-item ${activeId === c.id ? 'active' : ''}`}
                    onClick={() => navigate(`/category/${c.id}`)}
                  >
                    <CatIcon name={c.icon} size={16} />
                    <span className="cat-label">{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main */}
        <main className="cat-main">
          <div className="cat-toolbar">
            <h2 className="cat-title">{activeCat ? activeCat.label : 'All Products'}</h2>
            <FilterDrawer
              value={filter}
              onApply={setFilter}
              onReset={() => setFilter(FILTER_DEFAULT)}
              label="Filter"
            />
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
              <div className="emo">📦</div>
              <h3>No items match your filters</h3>
              <p className="muted">Try clearing your school or price range filters.</p>
              <button className="btn btn-ghost" onClick={() => setFilter(FILTER_DEFAULT)}>
                Reset filters
              </button>
            </div>
          ) : (
            panels.map((panel) => (
              <section key={panel.label} className="cat-panel">
                <div className="panel-head">
                  <h3>{panel.label}</h3>
                  <button
                    className="panel-see-all"
                    onClick={() => navigate(`/search?cat=${activeId}`)}
                  >
                    See All
                  </button>
                </div>
                <div className="panel-grid">
                  {panel.items.map((p, i) => (
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
                        <MapPin size={10} /> {p.campus}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
