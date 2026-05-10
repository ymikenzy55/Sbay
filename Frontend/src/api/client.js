import axios from 'axios';

/**
 * Axios instance for sBay API.
 * Backend URL can be configured via VITE_API_URL.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------
   Mock data layer — used while backend endpoints are being wired up.
   Swap any function body with `api.get(...)` to switch to real API.
------------------------------------------------------------------ */

const MOCK_DELAY = 350;
const wait = (ms = MOCK_DELAY) => new Promise((r) => setTimeout(r, ms));

const UNIVERSITIES = [
  { id: 'ug', label: 'UG · Legon', active: true },
  { id: 'knust', label: 'KNUST' },
  { id: 'ucc', label: 'UCC' },
  { id: 'upsa', label: 'UPSA' },
  { id: 'asuesi', label: 'ASUESI' },
];

const TRENDING = [
  {
    id: 't1',
    title: 'iPad Pro 12.9"',
    price: 4500,
    condition: 'Excellent Condition',
    campus: 'UG Legon',
    badge: 'HOTTEST',
    image:
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 't2',
    title: 'iPhone 13 128GB',
    price: 3800,
    condition: 'Slightly Used',
    campus: 'KNUST',
    badge: 'TRENDING',
    image:
      'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 't3',
    title: 'Apple Watch SE',
    price: 1200,
    condition: 'Brand New',
    campus: 'UCC',
    image:
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=900&auto=format&fit=crop&q=70',
  },
];

const SELLERS = [
  {
    id: 's1',
    name: 'Kofi Gadgets',
    rating: 4.9,
    reviews: 120,
    avatar:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 's2',
    name: "Ama's Boutique",
    rating: 4.8,
    reviews: 85,
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  },
];

const RECENT = [
  {
    id: 'r1',
    title: 'Nike Air Max Red',
    price: 650,
    tag: 'USED · LIKE NEW',
    posted: '2h ago',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r2',
    title: 'Beats Solo 3 Wireless',
    price: 1200,
    tag: 'BRAND NEW',
    posted: '3h ago',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r3',
    title: 'MacBook Pro 2019',
    price: 7500,
    tag: 'USED · FAIR',
    posted: '5h ago',
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r4',
    title: 'Sony Alpha A6400',
    price: 5200,
    tag: 'REFURBISHED',
    posted: '1d ago',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&auto=format&fit=crop&q=70',
  },
];

const ALL_PRODUCTS = [...TRENDING, ...RECENT].map((p) => ({
  ...p,
  description:
    'Carefully kept by a fellow student on campus. Ready for pickup or campus meet-up. Negotiation welcome — DM the seller via chat below.',
  sellerId: 's1',
  images: [p.image, p.image, p.image],
}));

const CHATS = [
  {
    id: 'c1',
    sellerId: 's1',
    name: 'Kofi Gadgets',
    avatar: SELLERS[0].avatar,
    last: 'Yes, the iPad is still available 👌',
    time: '2m',
    unread: 2,
  },
  {
    id: 'c2',
    sellerId: 's2',
    name: "Ama's Boutique",
    avatar: SELLERS[1].avatar,
    last: 'I can drop it at Night Market by 6pm',
    time: '1h',
    unread: 0,
  },
  {
    id: 'c3',
    sellerId: 's1',
    name: 'Yaw Electronics',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    last: 'Thanks for buying! 🙏',
    time: '1d',
    unread: 0,
  },
];

const MESSAGES = {
  c1: [
    { id: 1, from: 'them', text: 'Hello! Are you interested in the iPad?', time: '10:14' },
    { id: 2, from: 'me',   text: 'Yes, is it still available?',            time: '10:15' },
    { id: 3, from: 'them', text: 'Yes, the iPad is still available 👌',    time: '10:16' },
  ],
  c2: [
    { id: 1, from: 'me',   text: 'Hi! Where can we meet?', time: '09:00' },
    { id: 2, from: 'them', text: 'I can drop it at Night Market by 6pm', time: '09:05' },
  ],
  c3: [
    { id: 1, from: 'them', text: 'Thanks for buying! 🙏', time: 'Yesterday' },
  ],
};

const NOTIFICATIONS = {
  Today: [
    { id: 'n1', type: 'order',   title: 'Order confirmed', body: 'Your iPad Pro order is on its way 🎉', time: '10m' },
    { id: 'n2', type: 'price',   title: 'Price drop',      body: 'iPhone 13 dropped to GH₵ 3,800',       time: '2h' },
  ],
  Yesterday: [
    { id: 'n3', type: 'message', title: 'New message',     body: "Ama's Boutique replied to you",       time: '1d' },
    { id: 'n4', type: 'review',  title: 'Leave a review',  body: 'How was your purchase from Kofi Gadgets?', time: '1d' },
  ],
};

export const sbay = {
  async getUniversities() { await wait(); return UNIVERSITIES; },
  async getTrending()     { await wait(); return TRENDING; },
  async getSellers()      { await wait(); return SELLERS; },
  async getRecent()       { await wait(); return RECENT; },
  async getProduct(id)    { await wait(); return ALL_PRODUCTS.find((p) => p.id === id) || ALL_PRODUCTS[0]; },
  async getSeller(id)     {
    await wait();
    const seller = SELLERS.find((s) => s.id === id) || SELLERS[0];
    return {
      ...seller,
      university: 'University of Ghana, Legon',
      verified: true,
      bio: 'Selling lightly used campus gadgets since 2023. DM for fastest reply.',
      listings: ALL_PRODUCTS.slice(0, 6),
    };
  },
  async searchProducts(q) {
    await wait(150);
    if (!q) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) =>
      p.title.toLowerCase().includes(q.toLowerCase())
    );
  },
  async getChats()        { await wait(); return CHATS; },
  async getMessages(id)   { await wait(); return MESSAGES[id] || []; },
  async getNotifications(){ await wait(); return NOTIFICATIONS; },
};
