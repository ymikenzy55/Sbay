import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingCart, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../store/CartContext';
import './TopBar.css';

/**
 * Sticky app top bar.
 * Props:
 *  - showBack: render a back arrow instead of the logo
 *  - title: optional title shown when showBack is true
 *  - showSearch (default true): render the search input
 */
export default function TopBar({ showBack = false, title, showSearch = true }) {
  const navigate = useNavigate();
  const { count } = useCart();

  return (
    <header className="topbar">
      {showBack ? (
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      ) : (
        <Link to="/home"><Logo size="md" /></Link>
      )}

      {title && <h2 className="topbar-title">{title}</h2>}

      {showSearch && (
        <button
          type="button"
          className="search-wrap"
          onClick={() => navigate('/search')}
        >
          <Search size={18} className="search-icon" />
          <span className="search-input">Search campus deals...</span>
        </button>
      )}

      <div className="topbar-actions">
        <button
          className="icon-btn"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={20} />
          <span className="dot" />
        </button>
        <button
          className="icon-btn"
          aria-label="Cart"
          onClick={() => navigate('/cart')}
        >
          <ShoppingCart size={20} />
          {count > 0 && <span className="badge">{count}</span>}
        </button>
        <button
          className="avatar"
          onClick={() => navigate('/profile')}
          aria-label="Profile"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80)',
          }}
        />
      </div>
    </header>
  );
}
