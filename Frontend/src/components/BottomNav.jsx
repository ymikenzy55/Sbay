import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, MessageCircle, User, Plus } from 'lucide-react';
import './BottomNav.css';

const ITEMS = [
  { id: 'feed',    label: 'Feed',    path: '/home',    icon: LayoutGrid },
  { id: 'chat',    label: 'Chat',    path: '/chats',   icon: MessageCircle },
  { id: 'sell',    label: 'Sell',    path: '/sell',    icon: Plus, center: true },
  { id: 'profile', label: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, label, path, icon: Icon, center }) => {
        const active =
          pathname === path ||
          (path === '/chats' && pathname.startsWith('/chat'));
        return (
          <button
            key={id}
            className={`nav-item ${active ? 'active' : ''} ${center ? 'center' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="nav-icon"><Icon size={center ? 22 : 20} /></span>
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
