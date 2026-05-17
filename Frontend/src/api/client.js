import axios from 'axios';
import {
  adaptProduct, adaptSeller, adaptUser,
  adaptOrder, adaptChat, adaptMessage,
} from './adapters';

/**
 * Axios instances for sBay's public/user API and the obfuscated admin API.
 *
 * Token is loaded lazily from localStorage on every request so changes
 * propagate immediately after login/logout without us having to mutate
 * `axios.defaults` from the auth store.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ADMIN_URL = import.meta.env.VITE_ADMIN_API || `${API_URL}/_panel/control`;

export const TOKEN_KEY = 'sbay.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

function makeClient(baseURL) {
  const c = axios.create({ baseURL, timeout: 15000 });
  c.interceptors.request.use((cfg) => {
    const t = getToken();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  c.interceptors.response.use(
    (r) => r,
    (err) => {
      // Surface backend's `error` / `details` shape as the thrown message.
      const data = err.response?.data;
      if (data?.error) {
        const e = new Error(data.error);
        e.status = err.response.status;
        e.details = data.details;
        return Promise.reject(e);
      }
      return Promise.reject(err);
    }
  );
  return c;
}

export const api = makeClient(API_URL);
export const adminApi = makeClient(ADMIN_URL);

/* ------------------------------------------------------------------
   Static reference data — universities & categories.
   These don't yet live in the DB; admins can add categories per-listing
   freely, so we keep the canonical UI list here and let products use
   any string the seller chose. The school filter on the homepage works
   the same way.
------------------------------------------------------------------ */
const UNIVERSITIES = [
  { id: 'ug',     label: 'UG',     active: true },
  { id: 'knust',  label: 'KNUST' },
  { id: 'ucc',    label: 'UCC' },
  { id: 'upsa',   label: 'UPSA' },
  { id: 'ashesi', label: 'Ashesi' },
];

const SCHOOL_INFO = {
  ug:     { school: 'UG',     city: 'Accra' },
  knust:  { school: 'KNUST',  city: 'Kumasi' },
  ucc:    { school: 'UCC',    city: 'Cape Coast' },
  upsa:   { school: 'UPSA',   city: 'Accra' },
  ashesi: { school: 'Ashesi', city: 'Berekuso' },
};

const CATEGORIES = [
  { id: 'all',         label: 'All Items',   icon: 'ShoppingBag' },
  { id: 'electronics', label: 'Electronics', icon: 'Laptop'      },
  { id: 'fashion',     label: 'Fashion',     icon: 'Shirt'       },
  { id: 'books',       label: 'Books',       icon: 'BookOpen'    },
  { id: 'sports',      label: 'Sports',      icon: 'Dumbbell'    },
  { id: 'beauty',      label: 'Beauty',      icon: 'Sparkles'    },
  { id: 'music',       label: 'Music',       icon: 'Headphones'  },
  { id: 'gaming',      label: 'Gaming',      icon: 'Gamepad2'    },
  { id: 'food',        label: 'Food',        icon: 'UtensilsCrossed' },
];

const NOTIFICATIONS = { Today: [], Yesterday: [] };

/* ------------------------------------------------------------------
   `sbay` — same surface as before, now backed by real HTTP.
------------------------------------------------------------------ */
export const sbay = {
  async getUniversities() { return UNIVERSITIES; },

  async getCategories() {
    // Counts come from a quick aggregation — but we already paginate
    // server side; for now we surface the static list and the count is
    // best-effort via /products?category=&limit=1.
    return CATEGORIES;
  },

  async getTrending() {
    const { data } = await api.get('/products', { params: { sort: 'popular', limit: 12 } });
    return data.items.map(adaptProduct);
  },

  async getRecent() {
    const { data } = await api.get('/products', { params: { sort: 'recent', limit: 12 } });
    return data.items.map(adaptProduct);
  },

  async getAllProducts(params = {}) {
    const { data } = await api.get('/products', { params });
    return data.items.map(adaptProduct);
  },

  async getProductsByCategory(catId) {
    const params = catId && catId !== 'all' ? { category: catId } : {};
    const { data } = await api.get('/products', { params });
    return data.items.map(adaptProduct);
  },

  async getProduct(id) {
    const { data } = await api.get(`/products/${id}`);
    return adaptProduct(data.product);
  },

  async getSellers() {
    // No public "list of all sellers" endpoint — derive one from the
    // latest popular listings so the home page stays alive.
    const { data } = await api.get('/products', { params: { sort: 'popular', limit: 30 } });
    const seen = new Set();
    const sellers = [];
    for (const p of data.items) {
      const s = p.seller;
      if (!s || seen.has(s._id)) continue;
      seen.add(s._id);
      sellers.push(adaptSeller(s));
      if (sellers.length >= 8) break;
    }
    return sellers;
  },

  async getSeller(id) {
    const { data } = await api.get(`/users/sellers/${id}`);
    const seller = adaptSeller(data.seller);
    seller.listings = (data.listings || []).map(adaptProduct);
    return seller;
  },

  async getSchoolTree() {
    const items = (await this.getAllProducts({ limit: 60 }));
    const schoolIds = Object.keys(SCHOOL_INFO);
    const tree = schoolIds.map((sid) => {
      const inSchool = items.filter((p) => p.universityId === sid);
      const catIds = [...new Set(inSchool.map((p) => p.categoryId).filter(Boolean))];
      return {
        id: sid,
        label: SCHOOL_INFO[sid].school,
        city: SCHOOL_INFO[sid].city,
        categories: CATEGORIES.filter((c) => c.id !== 'all' && catIds.includes(c.id)),
      };
    });
    const others = items.filter((p) => !schoolIds.includes(p.universityId));
    const otherCats = [...new Set(others.map((p) => p.categoryId).filter(Boolean))];
    tree.push({
      id: 'others',
      label: 'Others',
      city: '',
      categories: CATEGORIES.filter((c) => c.id !== 'all' && otherCats.includes(c.id)),
    });
    return tree;
  },

  async getProductsByScope({ schoolId, categoryId } = {}) {
    const params = {};
    if (schoolId && schoolId !== 'others') params.school = SCHOOL_INFO[schoolId]?.school || schoolId;
    if (categoryId && categoryId !== 'all') params.category = categoryId;
    const { data } = await api.get('/products', { params });
    let items = data.items.map(adaptProduct);
    if (schoolId === 'others') {
      const known = Object.values(SCHOOL_INFO).map((s) => s.school);
      items = items.filter((p) => !known.includes(p.school));
    }
    return items;
  },

  async searchProducts(q) {
    if (!q) return this.getAllProducts();
    const { data } = await api.get('/products', { params: { q } });
    return data.items.map(adaptProduct);
  },

  /* ----- Chats ----- */
  async getChats() {
    const { data } = await api.get('/chats');
    return data.chats.map((c) => adaptChat(c, 'buyer'));
  },
  async getSellerChats() {
    const { data } = await api.get('/chats');
    return data.chats.map((c) => adaptChat(c, 'seller'));
  },
  async getMessages(chatId, currentUserId) {
    const { data } = await api.get(`/chats/${chatId}`);
    return data.messages.map((m) => adaptMessage(m, currentUserId));
  },
  async sendMessage(chatId, text) {
    const { data } = await api.post(`/chats/${chatId}/messages`, { text });
    return data.message;
  },
  async startChat(sellerId) {
    const { data } = await api.post('/chats/start', { sellerId });
    return data.chat;
  },

  /* ----- Plans / settings (public) ----- */
  async getPlans() {
    const { data } = await api.get('/plans');
    return data.plans;
  },
  async getPublicSettings() {
    const { data } = await api.get('/settings');
    return data.settings;
  },

  /* ----- Notifications — backend not implemented yet, return empty. ----- */
  async getNotifications() { return NOTIFICATIONS; },
};

/* ------------------------------------------------------------------
   Auth wrappers — used by AuthContext.
------------------------------------------------------------------ */
export const authApi = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return { token: data.token, user: adaptUser(data.user) };
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return { token: data.token, user: adaptUser(data.user) };
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return adaptUser(data.user);
  },
  async updateMe(patch) {
    const { data } = await api.patch('/users/me', patch);
    return adaptUser(data.user);
  },
  async becomeSeller(payload) {
    const { data } = await api.post('/users/me/become-seller', payload);
    return adaptUser(data.user);
  },
  async changePassword(payload) {
    const { data } = await api.post('/auth/change-password', payload);
    return data;
  },
  async addPaymentMethod(payload) {
    const { data } = await api.post('/users/me/payment-methods', payload);
    return adaptUser(data.user);
  },
  async removePaymentMethod(cardId) {
    const { data } = await api.delete(`/users/me/payment-methods/${cardId}`);
    return adaptUser(data.user);
  },
};

/* ------------------------------------------------------------------
   Product/order wrappers — used by Sell page, Cart, OrdersContext.
------------------------------------------------------------------ */
export const productApi = {
  async create(payload)        { const { data } = await api.post('/products', payload); return adaptProduct(data.product); },
  async update(id, payload)    { const { data } = await api.patch(`/products/${id}`, payload); return adaptProduct(data.product); },
  async remove(id)             { await api.delete(`/products/${id}`); return true; },
  async mine()                 { const { data } = await api.get('/products/mine'); return data.items.map(adaptProduct); },
};

export const orderApi = {
  async checkout(payload)      {
    const { data } = await api.post('/orders/checkout', payload);
    return (data.orders || []).map((o) => adaptOrder(o));
  },
  async mine(currentUserId)    {
    const { data } = await api.get('/orders/mine');
    return data.orders.map((o) => adaptOrder(o, currentUserId));
  },
  async sales(currentUserId)   {
    const { data } = await api.get('/orders/sales');
    return data.orders.map((o) => adaptOrder(o, currentUserId));
  },
  async get(id, currentUserId) {
    const { data } = await api.get(`/orders/${id}`);
    return adaptOrder(data.order, currentUserId);
  },
  async setStatus(id, status)  {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return adaptOrder(data.order);
  },
  async confirmReceipt(id)     {
    const { data } = await api.post(`/orders/${id}/confirm-receipt`);
    return adaptOrder(data.order);
  },
  async cancel(id, reason)     {
    const { data } = await api.post(`/orders/${id}/cancel`, { reason });
    return adaptOrder(data.order);
  },
};
