import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Tag, MessageSquare, Star, BellOff } from 'lucide-react';
import TopBar from '../components/TopBar';
import { sbay } from '../api/client';
import './pages.css';
import './Notifications.css';

const ICONS = { order: Package, price: Tag, message: MessageSquare, review: Star };
const TINTS = { order: '#0A7E3E', price: '#F5A623', message: '#1976D2', review: '#9C27B0' };

export default function Notifications() {
  const [groups, setGroups] = useState({});
  const [readAll, setReadAll] = useState(false);

  useEffect(() => { sbay.getNotifications().then(setGroups); }, []);

  const isEmpty = !Object.values(groups).some((g) => g.length);

  return (
    <div className="page">
      <TopBar showBack title="Notifications" showSearch={false} />
      <main className="page-main">
        {isEmpty ? (
          <div className="empty">
            <BellOff size={64} color="#C9D4BD" />
            <h3>All quiet here</h3>
            <p>You'll get notifications about orders, messages and price drops.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="chip" onClick={() => setReadAll(true)}>
                Mark all as read
              </button>
            </div>
            {Object.entries(groups).map(([label, list]) => (
              <section key={label}>
                <h3 className="page-h2 group-label">{label}</h3>
                <div className="notif-list">
                  {list.map((n, i) => {
                    const Icon = ICONS[n.type] || Package;
                    return (
                      <motion.article
                        key={n.id}
                        className={`notif-row ${readAll ? 'read' : ''}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div className="notif-icon" style={{ background: TINTS[n.type] + '22', color: TINTS[n.type] }}>
                          <Icon size={18} />
                        </div>
                        <div className="notif-body">
                          <h4>{n.title}</h4>
                          <p className="muted">{n.body}</p>
                        </div>
                        <span className="muted notif-time">{n.time}</span>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
