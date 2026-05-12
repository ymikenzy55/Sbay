import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Star, ShoppingCart, Check, Shield, BookmarkPlus, BookmarkCheck,
  Copy, X, MessageCircle, Facebook, Twitter, Send, Mail,
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
  const [shareOpen, setShareOpen] = useState(false);

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
  const shareUrl = `${window.location.origin}/product/${id}`;
  const shareText = product
    ? `Check out ${product.title} on sBay — GH₵ ${product.price.toLocaleString()}`
    : 'Check this out on sBay';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
    setShareOpen(false);
  };
  const openShare = (href) => {
    window.open(href, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };
  const nativeShare = async () => {
    try {
      await navigator.share({ title: product.title, text: shareText, url: shareUrl });
      setShareOpen(false);
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
            <button className="round-btn" onClick={() => setShareOpen(true)} aria-label="Share"><Share2 size={18} /></button>
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

      {/* Share popover */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div
              className="share-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareOpen(false)}
            />
            <motion.div
              className="share-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <header className="share-head">
                <h3>Share this item</h3>
                <button onClick={() => setShareOpen(false)} aria-label="Close"><X size={20} /></button>
              </header>
              <div className="share-grid">
                <button
                  className="share-opt whatsapp"
                  onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)}
                >
                  <span className="share-ic"><MessageCircle size={22} /></span>
                  <span>WhatsApp</span>
                </button>
                <button
                  className="share-opt twitter"
                  onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
                >
                  <span className="share-ic"><Twitter size={22} /></span>
                  <span>X / Twitter</span>
                </button>
                <button
                  className="share-opt facebook"
                  onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                >
                  <span className="share-ic"><Facebook size={22} /></span>
                  <span>Facebook</span>
                </button>
                <button
                  className="share-opt telegram"
                  onClick={() => openShare(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}
                >
                  <span className="share-ic"><Send size={22} /></span>
                  <span>Telegram</span>
                </button>
                <button
                  className="share-opt email"
                  onClick={() => openShare(`mailto:?subject=${encodeURIComponent(product.title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`)}
                >
                  <span className="share-ic"><Mail size={22} /></span>
                  <span>Email</span>
                </button>
                <button className="share-opt copy" onClick={copyLink}>
                  <span className="share-ic"><Copy size={22} /></span>
                  <span>Copy link</span>
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button className="share-opt more" onClick={nativeShare}>
                    <span className="share-ic"><Share2 size={22} /></span>
                    <span>More…</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
