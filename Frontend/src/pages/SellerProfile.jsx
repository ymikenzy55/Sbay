import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Shield, MapPin, MessageCircle, Send } from 'lucide-react';
import { sbay } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Skeleton, SkeletonGrid } from '../components/Skeleton';
import './pages.css';
import './SellerProfile.css';

const SEED_REVIEWS = [
  { id: 1, name: 'Akua',  rating: 5, text: 'Quick delivery. Item exactly as described!', time: '3d' },
  { id: 2, name: 'Kwame', rating: 5, text: 'Great seller, smooth transaction.',          time: '1w' },
  { id: 3, name: 'Adwoa', rating: 4, text: 'Good price, fair condition.',                 time: '2w' },
];

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState(null);
  const [tab, setTab] = useState('listings');
  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [draft, setDraft] = useState({ rating: 5, text: '' });

  const onChat = () => navigate('/chat/c1');

  const submitReview = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?next=' + encodeURIComponent(`/seller/${id}`));
      return;
    }
    if (!draft.text.trim()) return;
    setReviews((r) => [
      { id: Date.now(), name: user.name, rating: draft.rating, text: draft.text.trim(), time: 'now' },
      ...r,
    ]);
    setDraft({ rating: 5, text: '' });
  };

  useEffect(() => { sbay.getSeller(id).then(setSeller); }, [id]);

  if (!seller) {
    return (
      <div className="page sp">
        <div className="sp-hero" style={{ paddingBottom: 40 }}>
          <Skeleton w={92} h={92} r="50%" style={{ margin: '40px auto 12px', display: 'block' }} />
          <Skeleton w={140} h={20} style={{ margin: '0 auto', display: 'block' }} />
        </div>
        <main className="page-main">
          <SkeletonGrid count={6} />
        </main>
      </div>
    );
  }

  return (
    <div className="page sp">
      <div className="sp-hero">
        <button className="round-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="sp-avatar" style={{ backgroundImage: `url(${seller.avatar})` }} />
        <h1 className="sp-name">
          {seller.name} {seller.verified && <Shield size={16} color="#F5A623" />}
        </h1>
        <div className="sp-meta">
          <span><Star size={13} fill="#F5A623" color="#F5A623" /> {seller.rating} ({seller.reviews})</span>
          <span><MapPin size={13} /> {seller.university}</span>
        </div>
        <p className="sp-bio">{seller.bio}</p>
        <div className="sp-badges">
          <span className="badge-soft">⚡ Fast replier</span>
          <span className="badge-soft">✅ ID Verified</span>
          <span className="badge-soft">🏆 Top Seller</span>
        </div>
      </div>

      <div className="sp-tabs">
        <button className={`sp-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
          Listings ({seller.listings.length})
        </button>
        <button className={`sp-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews ({seller.reviews})
        </button>
      </div>

      <main className="page-main">
        {tab === 'listings' ? (
          <div className="sp-grid">
            {seller.listings.map((p, i) => (
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
        ) : (
          <div className="sp-reviews">
            <form className="card review-form" onSubmit={submitReview}>
              <h4>Leave a review</h4>
              <div className="rating-pick">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, rating: n }))}
                    aria-label={`${n} stars`}
                  >
                    <Star size={20} fill={n <= draft.rating ? '#F5A623' : 'transparent'} color={n <= draft.rating ? '#F5A623' : '#C9D4BD'} />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder={user ? 'Share your experience with this seller...' : 'Sign in to leave a review'}
                value={draft.text}
                onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              />
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
                <Send size={14} /> {user ? 'Post Review' : 'Sign in to post'}
              </button>
            </form>

            {reviews.map((r) => (
              <article key={r.id} className="card review-card">
                <div className="review-head">
                  <strong>{r.name}</strong>
                  <span className="muted">{r.time}</span>
                </div>
                <div className="review-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? '#F5A623' : '#E5E4E7'} color={i < r.rating ? '#F5A623' : '#E5E4E7'} />
                  ))}
                </div>
                <p style={{ marginTop: 6 }}>{r.text}</p>
              </article>
            ))}
          </div>
        )}
      </main>

      <button className="floating-msg" onClick={onChat}>
        <MessageCircle size={18} /> Message Seller
      </button>
    </div>
  );
}
