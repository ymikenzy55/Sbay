import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../store/AuthContext';
import './pages.css';
import './Profile.css';

export default function ProfileWishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wishlistItems = useMemo(() => [], []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'seller') {
    return <Navigate to="/seller-dashboard" replace />;
  }

  return (
    <div className="page">
      <TopBar showSearch={false} title="Wishlist" />
      <main className="page-main">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
        <div className="wishlist-grid">
          {wishlistItems.length === 0 ? (
            <div className="empty">
              <Heart size={48} color="#C9D4BD" />
              <h3>No wishlist items yet</h3>
              <p className="muted">Save products you like and they'll appear here.</p>
              <button className="btn btn-primary" onClick={() => navigate('/home')}>
                Browse marketplace
              </button>
            </div>
          ) : (
            wishlistItems.map((w) => (
              <article
                key={w.id}
                className="result-card"
                onClick={() => navigate(`/product/${w.id}`)}
              >
                <div className="result-img" style={{ backgroundImage: `url(${w.image})` }} />
                <div className="result-body">
                  <h4 className="prod-title">{w.title}</h4>
                  <span className="price">GH₵ {w.price.toLocaleString()}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}