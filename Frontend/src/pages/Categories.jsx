import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import * as Lucide from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

/** Resolve a string icon name from the API into a lucide component. */
function CatIcon({ name, size = 18 }) {
  const Icon = Lucide[name] || Lucide.Tag;
  return <Icon size={size} />;
}

export default function Categories() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState(null);
  const activeId = catId || 'all';

  useEffect(() => { sbay.getCategories().then(setCategories); }, []);

  useEffect(() => {
    setProducts(null);
    sbay.getProductsByCategory(activeId).then(setProducts);
  }, [activeId]);

  const activeCat = categories.find((c) => c.id === activeId);

  // Build "panels" similar to the reference image — multiple labelled
  // sections per category. We slice the same product list to fake sub-groups.
  const panels = useMemo(() => {
    if (!products) return [];
    if (products.length === 0) return [];
    const chunks = [];
    const labels = ['Top Picks', 'New Arrivals', 'Under GH₵ 1,000', 'Most Loved'];
    let i = 0;
    let label = 0;
    while (i < products.length && label < labels.length) {
      const next = products.slice(i, i + 6);
      if (next.length === 0) break;
      chunks.push({ label: labels[label], items: next });
      i += 6;
      label += 1;
    }
    if (chunks.length === 0) chunks.push({ label: 'All items', items: products });
    return chunks;
  }, [products]);

  return (
    <div className="page cat-page">
      <TopBar showBack title="Categories" />

      <div className="cat-layout">
        {/* Sidebar — vertical on every screen size */}
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
          {/* Top "All Products" header card */}
          <button
            className="cat-all-card"
            onClick={() => navigate('/search')}
          >
            <span>{activeCat ? `${activeCat.label} · All Products` : 'All Products'}</span>
            <ChevronRight size={18} />
          </button>

          {products === null ? (
            <div className="panel-skel">
              <Skeleton w={160} h={20} />
              <div className="panel-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h={120} r={10} />
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="emo">📦</div>
              <h3>No items in this category yet</h3>
              <p>Check back soon or browse another category.</p>
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
