import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Star, ShoppingCart, Check, Shield, BookmarkPlus, BookmarkCheck,
  Copy, X, MessageCircle, Send, Mail, MapPin,
} from 'lucide-react';
import { sbay } from '../api/client';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { Skeleton } from '../components/Skeleton';
import './pages.css';
import './ProductDetail.css';

/* Inline brand SVGs — lucide-react v1 doesn't ship brand icons. */
const WhatsAppIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} fill="currentColor" aria-hidden="true">
    <path d="M20.52 3.48A11.78 11.78 0 0012.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.93 11.93 0 005.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.18-3.49-8.41zM12.06 21.8h-.01a9.83 9.83 0 01-5.01-1.37l-.36-.21-3.72.97 1-3.62-.23-.37a9.87 9.87 0 01-1.5-5.25c0-5.47 4.46-9.92 9.93-9.92 2.65 0 5.14 1.03 7.02 2.91a9.88 9.88 0 012.9 7.02c0 5.47-4.45 9.92-9.92 9.92zm5.44-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35z"/>
  </svg>
);
const TwitterXIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21l-6.53 7.46L22.5 22h-6.75l-4.78-6.26L5.3 22H2.54l7-8-7.04-12h6.92l4.32 5.72L18.244 2zm-1.18 18h1.66L7.03 4H5.3l11.764 16z"/>
  </svg>
);
const FacebookIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.52 17.52 2 11.99 2S2 6.52 2 12.06c0 4.98 3.66 9.11 8.44 9.88v-6.99H7.9v-2.89h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.57v1.88h2.77l-.44 2.89h-2.33V22c4.78-.77 8.44-4.9 8.44-9.94z"/>
  </svg>
);

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
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    sbay.getProduct(id).then((p) => {
      setProduct(p);
      sbay.getSeller(p.sellerId).then(setSeller);
      sbay.getAllProducts().then((all) => {
        const same = all.filter((x) => x.id !== p.id && x.categoryId === p.categoryId);
        const fill = all.filter((x) => x.id !== p.id && x.categoryId !== p.categoryId);
        setSimilar([...same, ...fill].slice(0, 6));
      });
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

        {similar.length > 0 && (
          <section className="pdp-similar">
            <h3 className="page-h2">Similar products</h3>
            <div className="pdp-similar-grid">
              {similar.map((s) => (
                <motion.article
                  key={s.id}
                  className="pdp-similar-card"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/product/${s.id}`)}
                >
                  <div
                    className="pdp-similar-img"
                    style={{ backgroundImage: `url(${s.image})` }}
                  />
                  <div className="pdp-similar-body">
                    <h4>{s.title}</h4>
                    <span className="price">GH₵ {s.price.toLocaleString()}</span>
                    {(s.campus || s.location) && (
                      <p className="pdp-similar-loc">
                        <MapPin size={12} />
                        <span>{s.campus}{s.location ? ` · ${s.location}` : ''}</span>
                      </p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
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
                  <span className="share-ic"><WhatsAppIcon size={22} /></span>
                  <span>WhatsApp</span>
                </button>
                <button
                  className="share-opt twitter"
                  onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
                >
                  <span className="share-ic"><TwitterXIcon size={22} /></span>
                  <span>X / Twitter</span>
                </button>
                <button
                  className="share-opt facebook"
                  onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                >
                  <span className="share-ic"><FacebookIcon size={22} /></span>
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
