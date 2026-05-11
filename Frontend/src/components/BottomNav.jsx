import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, MessageCircle, User, Plus } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import './BottomNav.css';

/**
 * Mobile bottom navigation: Home · Categories · [Sell CTA] · Chat · Profile.
 * The Sell button is a raised gold CTA — NOT a selectable tab, so it never
 * appears "active".
 */
const ITEMS = [
  { id: 'home',       label: 'Home',       path: '/home',       icon: Home },
  { id: 'categories', label: 'Categories', path: '/categories', icon: LayoutGrid },
  { id: 'sell',       label: 'Sell',       path: '/sell',       icon: Plus, center: true },
  { id: 'chat',       label: 'Chat',       path: '/chats',      icon: MessageCircle },
  { id: 'profile',    label: 'Profile',    path: '/profile',    icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const handleClick = (item) => {
    if (item.id === 'sell') {
      // Smart routing for the sell CTA.
      if (!user) navigate('/signup?next=' + encodeURIComponent('/become-seller'));
      else if (user.role !== 'seller') navigate('/become-seller');
      else navigate('/sell');
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const { id, label, path, icon: Icon, center } = item;
        // Center button never highlights as "active" — it's a standalone CTA.
        const active = !center && (
          pathname === path ||
          (path === '/chats' && pathname.startsWith('/chat')) ||
          (path === '/categories' && pathname.startsWith('/category'))
        );
        return (
          <button
            key={id}
            className={`nav-item ${active ? 'active' : ''} ${center ? 'center' : ''}`}
            onClick={() => handleClick(item)}
          >
            <span className="nav-icon"><Icon size={center ? 24 : 20} /></span>
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
