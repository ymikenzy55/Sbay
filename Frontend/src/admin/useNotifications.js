import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/client';
import { useSocket } from '../hooks/useSocket';

/**
 * Notifications layer for the admin shell.
 *
 * Combines polling (every 30s) with Socket.IO real-time events.
 * When a socket event arrives, we inject a temporary item and
 * refresh from the server to get the full list.
 */

const SEEN_KEY = 'sbay.admin.seenNotes';

function readSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
}
function writeSeen(set) {
  // Cap to 500 most-recent ids so the storage doesn't grow unbounded.
  const trimmed = Array.from(set).slice(-500);
  localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

export function useNotifications() {
  const [items, setItems] = useState([]);
  const seenRef = useRef(readSeen());
  const { on, off, connected } = useSocket();

  const tick = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/notifications');
      const next = (data?.items || []).map((n) => ({
        ...n,
        read: seenRef.current.has(n.id),
      }));
      setItems(next);
    } catch {
      // Silent — endpoint may not be live yet. Keep local list.
    }
  }, []);

  // Polling fallback.
  useEffect(() => {
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [tick]);

  // Real-time socket events.
  useEffect(() => {
    if (!connected) return;

    const handleSupport = (payload) => {
      // Inject a temporary notification and refresh.
      setItems((cur) => [
        { id: `support-${Date.now()}`, kind: 'support', message: `New support ticket: ${payload.subject || 'No subject'}`, at: new Date().toISOString(), href: '/admin/support', read: false },
        ...cur,
      ]);
      tick();
    };

    const handleVerification = (payload) => {
      setItems((cur) => [
        { id: `verification-${Date.now()}`, kind: 'verification', message: payload.message || 'New verification request', at: new Date().toISOString(), href: '/admin/verification/students', read: false },
        ...cur,
      ]);
      tick();
    };

    on('support:new', handleSupport);
    on('verification:new', handleVerification);

    return () => {
      off('support:new', handleSupport);
      off('verification:new', handleVerification);
    };
  }, [connected, on, off, tick]);

  const markAllRead = useCallback(() => {
    const s = seenRef.current;
    items.forEach((n) => s.add(n.id));
    writeSeen(s);
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
  }, [items]);

  const unread = items.reduce((n, x) => n + (x.read ? 0 : 1), 0);
  return { items, unread, markAllRead, refresh: tick };
}
