import { createContext, useContext, useMemo, useState } from 'react';

/**
 * Shared in-memory orders store.
 *
 * The same record is the authoritative source for both:
 *   - the BUYER's "My Orders" list (filtered by buyerId)
 *   - the SELLER's "Orders received" list (filtered by sellerId)
 *
 * That's why a status change made by the seller (e.g. "Shipped") is reflected
 * immediately on the buyer's order timeline — they're literally the same object.
 *
 * Real backend would store these in Postgres + push updates over websockets.
 */

export const ORDER_STATUSES = [
  { id: 'pending',    label: 'Pending',    description: 'Awaiting seller confirmation' },
  { id: 'processing', label: 'Processing', description: 'Seller is preparing the item' },
  { id: 'shipped',    label: 'Shipped',    description: 'On the way to the buyer' },
  { id: 'delivered',  label: 'Delivered',  description: 'Marked as delivered' },
  { id: 'completed',  label: 'Completed',  description: 'Buyer confirmed receipt' },
  { id: 'canceled',   label: 'Canceled',   description: 'Order was canceled' },
];

const SEED_ORDERS = [
  {
    id: 'SB-3104',
    buyerId:  'me',           // current logged-in user, when in buyer mode
    sellerId: 's2',
    sellerName: "Ama's Boutique",
    buyerName: 'You',
    buyerLocation: 'UG, Legon',
    title: 'Logitech MX Master 3 Mouse',
    price: 780,
    qty: 1,
    method: 'escrow',
    status: 'processing',
    placedAt: Date.now() - 3 * 24 * 3600e3,
    eta: 'Tomorrow, by 6pm',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=70',
  },
  {
    id: 'SB-3088',
    buyerId:  'me',
    sellerId: 's3',
    sellerName: 'Yaw Electronics',
    buyerName: 'You',
    buyerLocation: 'UG, Legon',
    title: 'Adjustable Standing Desk',
    price: 2200,
    qty: 1,
    method: 'meetup',
    status: 'shipped',
    placedAt: Date.now() - 1 * 24 * 3600e3,
    eta: 'Today, by 5pm',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70',
  },
  {
    id: 'SB-2980',
    buyerId:  'me',
    sellerId: 's1',
    sellerName: 'Kofi Gadgets',
    buyerName: 'You',
    buyerLocation: 'UG, Legon',
    title: 'Wireless Charger',
    price: 220,
    qty: 1,
    method: 'escrow',
    status: 'completed',
    placedAt: Date.now() - 7 * 24 * 3600e3,
    eta: 'Delivered',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=70',
  },
  /* Orders received by the current seller (sellerId === 'me') */
  {
    id: 'SB-4011',
    buyerId:  'b1',
    sellerId: 'me',
    buyerName: 'Akwasi Mensah',
    buyerLocation: 'UG Legon · Akuafo Hall',
    sellerName: 'Your store',
    title: 'iPad Pro 12.9" — 256GB',
    price: 4500,
    qty: 1,
    method: 'escrow',
    status: 'pending',
    placedAt: Date.now() - 30 * 60e3,
    eta: 'Awaiting confirmation',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=70',
  },
  {
    id: 'SB-4002',
    buyerId:  'b2',
    sellerId: 'me',
    buyerName: 'Adwoa Osei',
    buyerLocation: 'KNUST · Unity Hall',
    sellerName: 'Your store',
    title: 'iPhone 13 — 128GB',
    price: 3800,
    qty: 1,
    method: 'escrow',
    status: 'processing',
    placedAt: Date.now() - 4 * 3600e3,
    eta: 'Confirm shipping by tomorrow',
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=70',
  },
  {
    id: 'SB-3995',
    buyerId:  'b3',
    sellerId: 'me',
    buyerName: 'Yaw Boateng',
    buyerLocation: 'UCC · Casford Hall',
    sellerName: 'Your store',
    title: 'Apple Watch SE',
    price: 1200,
    qty: 1,
    method: 'meetup',
    status: 'shipped',
    placedAt: Date.now() - 26 * 3600e3,
    eta: 'On the way',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=70',
  },
];

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(SEED_ORDERS);

  const value = useMemo(() => ({
    orders,
    /** Orders where the current user is the buyer. */
    myOrders: orders.filter((o) => o.buyerId === 'me'),
    /** Orders received by the current user as a seller. */
    salesOrders: orders.filter((o) => o.sellerId === 'me'),
    setStatus: (id, status) =>
      setOrders((all) => all.map((o) => (o.id === id ? { ...o, status } : o))),
    addOrder: (order) =>
      setOrders((all) => [{ id: 'SB-' + Date.now(), ...order }, ...all]),
  }), [orders]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>');
  return ctx;
};
