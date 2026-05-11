import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SkeletonGrid } from '../components/Skeleton';
import { sbay } from '../api/client';
import './pages.css';
import './Categories.css';

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

  return (
    <div className="page cat-page">
      <TopBar showBack title="Categories" />

      <div className="cat-layout">
        {/* Sidebar */}
        <aside className="cat-sidebar">
          <h3 className="cat-side-title">Categories</h3>
          <ul className="cat-list">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  className={`cat-item ${activeId === c.id ? 'active' : ''}`}
                  onClick={() => navigate(`/category/${c.id}`)}
                >
                  <span className="cat-emoji">{c.icon}</span>
                  <span className="cat-label">{c.label}</span>
                  <span className="cat-count">{c.count}</span>
                  <ChevronRight size={14} className="cat-chev" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <main className="cat-main">
          <header className="cat-head">
            <h2>{activeCat ? `${activeCat.icon} ${activeCat.label}` : 'All Items'}</h2>
            <p className="muted small">
              {products ? `${products.length} items` : 'Loading...'}
            </p>
          </header>

          {products === null ? (
            <SkeletonGrid count={6} />
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="emo">📦</div>
              <h3>No items in this category yet</h3>
              <p>Check back soon or browse another category.</p>
            </div>
          ) : (
            <div className="cat-grid">
              {products.map((p, i) => (
                <motion.article
                  key={p.id}
                  className="result-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
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
      </div>

      <BottomNav />
    </div>
  );
}
