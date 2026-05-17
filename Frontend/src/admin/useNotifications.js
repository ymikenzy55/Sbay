import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/client';

/**
 * Polled notifications layer for the admin shell.
 *
 * Phase 1: client polls /admin/notifications every 25s and de-dupes
 * against a localStorage seen-set, so the bell badge reflects the
 * server's view across tabs. Phase 3 replaces polling with a
 * Socket.IO subscription — the public hook surface stays identical.
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

  const tick = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/notifications');
      const next = (data?.items || []).map((n) => ({
        ...n,
        read: seenRef.current.has(n.id),
      }));
      setItems(next);
    } catch {
      // Silent — endpoint may not be live yet (Phase 3). Keep local list.
    }
  }, []);

  useEffect(() => {
    tick();
    const t = setInterval(tick, 25_000);
    return () => clearInterval(t);
  }, [tick]);

  const markAllRead = useCallback(() => {
    const s = seenRef.current;
    items.forEach((n) => s.add(n.id));
    writeSeen(s);
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
  }, [items]);

  const unread = items.reduce((n, x) => n + (x.read ? 0 : 1), 0);
  return { items, unread, markAllRead, refresh: tick };
}
