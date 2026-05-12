import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Star, ShoppingCart, Check, Shield, BookmarkPlus, BookmarkCheck,
} from 'lucide-react';
import { sbay } from '../api/client';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { Skeleton } from '../components/Skeleton';
import './pages.css';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const requireAuth = (next) =>
    !user && (navigate('/login?next=' + encodeURIComponent(next)), true);
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    sbay.getProduct(id).then((p) => {
      setProduct(p);
      sbay.getSeller(p.sellerId).then(setSeller);
    });
  }, [id]);

  if (!product) {
    return (
      <div className="page pdp">
        <Skeleton h={360} r={0} />
        <main className="page-main pdp-body">
          <Skeleton w="70%" h={28} />
          <Skeleton w="40%" h={20} />
          <Skeleton h={120} r={16} style={{ marginTop: 8 }} />
          <Skeleton h={80} r={16} style={{ marginTop: 8 }} />
        </main>
      </div>
    );
  }

  const handleAdd = () => {
    if (requireAuth(`/product/${id}`)) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  const handleWishlist = () => {
    if (requireAuth(`/product/${id}`)) return;
    setSaved((s) => !s);
  };
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  };
  const handleShare = async () => {
    const url = `${window.location.origin}/product/${id}`;
    const data = {
      title: product.title,
      text: `Check out ${product.title} on sBay — GH₵ ${product.price.toLocaleString()}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
        return;
      }
      window.prompt('Copy this link:', url);
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Unable to share');
    }
  };

  return (
    <div className="page pdp">
      {/* Image carousel */}
      <div className="pdp-hero" style={{ backgroundImage: `url(${product.images[activeImg]})` }}>
        <div className="pdp-hero-bar">
          <button className="round-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <div className="pdp-hero-actions">
            <button className="round-btn" onClick={() => setSaved(!saved)} aria-label="Save">
              <Heart size={18} fill={saved ? '#D32F2F' : 'none'} color={saved ? '#D32F2F' : 'currentColor'} />
            </button>
            <button className="round-btn" onClick={handleShare} aria-label="Share"><Share2 size={18} /></button>
          </div>
        </div>
        <div className="pdp-thumbs">
          {product.images.map((img, i) => (
            <button
              key={i}
              className={`thumb ${i === activeImg ? 'active' : ''}`}
              onClick={() => setActiveImg(i)}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
      </div>

      <main className="page-main pdp-body">
        <section>
          <div className="pdp-titlerow">
            <h1 className="pdp-title">{product.title}</h1>
            <span className="pdp-price">GH₵ {product.price.toLocaleString()}</span>
          </div>
          <div className="pdp-meta">
            <span className="badge-soft"><Check size={12} /> {product.condition || 'Brand New'}</span>
            <span className="badge-soft">{product.campus || 'UG · Legon'}</span>
          </div>
        </section>

        <section className="card">
          <h3 className="page-h2">Description</h3>
          <p className="muted" style={{ marginTop: 8 }}>{product.description}</p>
        </section>

        {seller && (
          <section
            className="card seller-row"
            onClick={() => navigate(`/seller/${seller.id}`)}
          >
            <div className="seller-avatar lg" style={{ backgroundImage: `url(${seller.avatar})` }} />
            <div style={{ flex: 1 }}>
              <h4>{seller.name} {seller.verified && <Shield size={14} color="#0A7E3E" style={{ verticalAlign: 'middle' }} />}</h4>
              <p className="muted" style={{ fontSize: '.85rem' }}>
                <Star size={12} fill="#F5A623" color="#F5A623" /> {seller.rating} ({seller.reviews}) · {seller.university}
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={(e) => { e.stopPropagation(); navigate(`/sellers/${seller.id}`); }}
            >
              View profile
            </button>
          </section>
        )}
      </main>

      {/* Sticky bottom action bar */}
      <div className="pdp-actions">
        <button
          className={`btn btn-ghost ${saved ? 'is-saved' : ''}`}
          onClick={handleWishlist}
          aria-pressed={saved}
        >
          {saved ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
          {saved ? 'Saved' : 'Wishlist'}
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>
          <ShoppingCart size={18} /> Add to Cart
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {added && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Check size={16} /> Added to cart!
          </motion.div>
        )}
        {toastMsg && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Share2 size={16} /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
