import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { orderApi } from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';

/**
 * Orders store backed by the real backend.
 *
 * On mount (and whenever the signed-in user changes) we fetch
 *   - /orders/mine  for the buyer view
 *   - /orders/sales for the seller view (sellers only)
 *
 * Adapters normalise both lists into the same shape pages already use,
 * with `buyerId === 'me'` flagging orders the current user placed and
 * `sellerId === 'me'` flagging orders the current user received.
 */

export const ORDER_STATUSES = [
  { id: 'pending',    label: 'Pending',    description: 'Awaiting seller confirmation' },
  { id: 'processing', label: 'Processing', description: 'Seller is preparing the item' },
  { id: 'shipped',    label: 'Shipped',    description: 'On the way to the buyer' },
  { id: 'delivered',  label: 'Delivered',  description: 'Marked as delivered' },
  { id: 'completed',  label: 'Completed',  description: 'Buyer confirmed receipt' },
  { id: 'canceled',   label: 'Canceled',   description: 'Order was canceled' },
];

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const { on, off, connected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user?.id) { setOrders([]); return; }
    setLoading(true);
    try {
      const buys = await orderApi.mine(user.id);
      const sales = user.role === 'seller' ? await orderApi.sales(user.id) : [];
      // Dedupe in case an order has the user as both (shouldn't, but
      // belt-and-braces): take the first occurrence.
      const seen = new Set();
      const merged = [];
      for (const o of [...buys, ...sales]) {
        if (!seen.has(o._id)) { seen.add(o._id); merged.push(o); }
      }
      setOrders(merged);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!connected || !user?.id) return undefined;
    const refresh = () => reload();
    on('order:new', refresh);
    on('order:updated', refresh);
    return () => {
      off('order:new', refresh);
      off('order:updated', refresh);
    };
  }, [connected, user?.id, on, off, reload]);

  const value = useMemo(() => ({
    orders, loading, reload,
    myOrders:    orders.filter((o) => o.buyerId  === 'me'),
    salesOrders: orders.filter((o) => o.sellerId === 'me'),

    /** Seller-driven status change: processing | shipped | delivered. */
    setStatus: async (id, status) => {
      const o = orders.find((x) => x._id === id || x.id === id);
      if (!o) return;
      const updated = await orderApi.setStatus(o._id, status);
      setOrders((all) => all.map((x) => (x._id === updated._id
        ? { ...updated, buyerId: x.buyerId, sellerId: x.sellerId }
        : x)));
    },

    /** Buyer confirms they received the item → releases escrow. */
    confirmReceipt: async (id) => {
      const o = orders.find((x) => x._id === id || x.id === id);
      if (!o) return;
      const updated = await orderApi.confirmReceipt(o._id);
      setOrders((all) => all.map((x) => (x._id === updated._id
        ? { ...updated, buyerId: x.buyerId, sellerId: x.sellerId }
        : x)));
    },

    /** Cancel an order (pre-shipment). Backend restores stock. */
    cancel: async (id, reason) => {
      const o = orders.find((x) => x._id === id || x.id === id);
      if (!o) return;
      const updated = await orderApi.cancel(o._id, reason);
      setOrders((all) => all.map((x) => (x._id === updated._id
        ? { ...updated, buyerId: x.buyerId, sellerId: x.sellerId }
        : x)));
    },

    /**
     * Local insertion after a successful checkout. The Checkout page
     * already gets the freshly-created Orders back from `orderApi.checkout`,
     * but adding them to the local store means buyers see them on the
     * next page without a refetch round-trip.
     */
    addOrder: (order) => {
      const o = { ...order, buyerId: 'me' };
      setOrders((all) => [o, ...all]);
    },
  }), [orders, loading, reload]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>');
  return ctx;
};
