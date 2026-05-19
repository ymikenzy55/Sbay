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
      if (!err.response && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sbay:network-error'));
      }
      return Promise.reject(err);
    }
  );
  return c;
}

export const api = makeClient(API_URL);
export const adminApi = makeClient(ADMIN_URL);

const NOTIFICATIONS = { Today: [], Yesterday: [] };
const cache = new Map();
const cached = async (key, ttlMs, fetcher) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await fetcher();
  cache.set(key, { at: Date.now(), value });
  return value;
};

/* ------------------------------------------------------------------
   `sbay` — same surface as before, now backed by real HTTP.
------------------------------------------------------------------ */
export const sbay = {
  async getUniversities() {
    const meta = await this.getCatalogMeta();
    return meta.schools.map((s) => ({
      id: s.id,
      label: s.label,
      active: true,
    }));
  },

  async getCatalogMeta() {
    return cached('catalog-meta', 60_000, async () => {
      const { data } = await api.get('/products/catalog');
      return data;
    });
  },

  async getCategories() {
    const meta = await this.getCatalogMeta();
    return [
      { id: 'all', label: 'All Items', icon: 'ShoppingBag' },
      ...meta.categories.map((c) => ({
        id: c.id,
        label: c.label,
        icon: 'Tag',
        count: c.count,
      })),
    ];
  },

  async getTrending() {
    return cached('products-trending', 30_000, async () => {
      const { data } = await api.get('/products', { params: { sort: 'popular', limit: 12 } });
      return data.items.map(adaptProduct);
    });
  },

  async getRecent() {
    return cached('products-recent', 30_000, async () => {
      const { data } = await api.get('/products', { params: { sort: 'recent', limit: 12 } });
      return data.items.map(adaptProduct);
    });
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
    const meta = await this.getCatalogMeta();
    const schools = meta.schools.map((school) => ({
      id: school.id,
      label: school.label,
      city: school.city || '',
      categories: school.categories.map((c) => ({
        id: c.id,
        label: c.label,
        icon: 'Tag',
        count: c.count,
      })),
    }));
    if (meta.categories.length) {
      const known = new Set(schools.flatMap((school) => school.categories.map((c) => c.id)));
      const uncategorized = meta.categories.filter((c) => !known.has(c.id));
      if (uncategorized.length) {
        schools.push({
          id: 'others',
          label: 'Others',
          city: '',
          categories: uncategorized.map((c) => ({
            id: c.id,
            label: c.label,
            icon: 'Tag',
            count: c.count,
          })),
        });
      }
    }
    return schools;
  },

  async getProductsByScope({ schoolId, categoryId } = {}) {
    const params = {};
    if (schoolId && schoolId !== 'others') {
      const meta = await this.getCatalogMeta();
      const school = meta.schools.find((s) => s.id === schoolId);
      params.school = school?.label || schoolId;
    }
    if (categoryId && categoryId !== 'all') params.category = categoryId;
    const { data } = await api.get('/products', { params });
    return data.items.map(adaptProduct);
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
  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  async resetPassword(payload) {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },
  async googleAuth(accessToken) {
    const { data } = await api.post('/auth/oauth/google', { accessToken });
    return { token: data.token, user: adaptUser(data.user) };
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

export const notificationApi = {
  async mine() {
    const { data } = await api.get('/users/me/notifications');
    return data.items || [];
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

export const paymentApi = {
  async initialize(payload) {
    const { data } = await api.post('/payments/initialize', payload);
    return data;
  },
  async verify(reference) {
    const { data } = await api.post('/payments/verify', { reference });
    return data;
  },
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
