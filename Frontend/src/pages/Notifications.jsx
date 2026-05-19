import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, MessageSquare, Star, BellOff, ShieldCheck, LifeBuoy } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useUserNotifications } from '../hooks/useUserNotifications';
import './pages.css';
import './Notifications.css';

const ICONS = {
  order: Package,
  message: MessageSquare,
  review: Star,
  verification: ShieldCheck,
  support: LifeBuoy,
};
const TINTS = {
  order: '#0A7E3E',
  message: '#1976D2',
  review: '#9C27B0',
  verification: '#F5A623',
  support: '#0A7E3E',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { items, unread, markAllRead } = useUserNotifications();
  const isEmpty = items.length === 0;

  return (
    <div className="page">
      <TopBar showBack title="Notifications" showSearch={false} />
      <main className="page-main">
        {isEmpty ? (
          <div className="empty">
            <BellOff size={64} color="#C9D4BD" />
            <h3>All quiet here</h3>
            <p>You'll get notifications about orders, messages and account updates.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="muted small">{unread} unread notification{unread === 1 ? '' : 's'}</p>
              <button className="chip" onClick={markAllRead}>Mark all as read</button>
            </div>
            <div className="notif-list">
              {items.map((n, i) => {
                const Icon = ICONS[n.type] || Package;
                return (
                  <motion.button
                    key={n.id}
                    className={`notif-row ${n.read ? 'read' : ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => n.href && navigate(n.href)}
                  >
                    <div className="notif-icon" style={{ background: `${TINTS[n.type] || TINTS.order}22`, color: TINTS[n.type] || TINTS.order }}>
                      <Icon size={18} />
                    </div>
                    <div className="notif-body">
                      <h4>{n.title}</h4>
                      <p className="muted">{n.body}</p>
                    </div>
                    <span className="muted notif-time">
                      {n.at ? new Date(n.at).toLocaleDateString() : ''}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
