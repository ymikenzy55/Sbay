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
  { id: 'ug', label: 'UG', active: true },
  { id: 'knust', label: 'KNUST' },
  { id: 'ucc', label: 'UCC' },
  { id: 'upsa', label: 'UPSA' },
  { id: 'ashesi', label: 'Ashesi' },
];

const TRENDING = [
  {
    id: 't1',
    title: 'iPad Pro 12.9"',
    price: 4500,
    condition: 'Excellent Condition',
    campus: 'UG Legon',
    universityId: 'ug',
    location: 'Akuafo Hall',
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
    universityId: 'knust',
    location: 'Unity Hall',
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
    universityId: 'ucc',
    location: 'Casford Hall',
    image:
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=900&auto=format&fit=crop&q=70',
  },
];

// Icon names map to lucide-react icons; resolved by the UI.
const CATEGORIES = [
  { id: 'all',         label: 'All Items',   icon: 'ShoppingBag', count: 1204 },
  { id: 'electronics', label: 'Electronics', icon: 'Laptop',      count: 342  },
  { id: 'fashion',     label: 'Fashion',     icon: 'Shirt',       count: 218  },
  { id: 'books',       label: 'Books',       icon: 'BookOpen',    count: 176  },
  { id: 'sports',      label: 'Sports',      icon: 'Dumbbell',    count: 98   },
  { id: 'beauty',      label: 'Beauty',      icon: 'Sparkles',    count: 141  },
  { id: 'music',       label: 'Music',       icon: 'Headphones',  count: 67   },
  { id: 'gaming',      label: 'Gaming',      icon: 'Gamepad2',    count: 89   },
  { id: 'food',        label: 'Food',        icon: 'UtensilsCrossed', count: 43 },
];

/* Used to render the 'school, city' label on product cards and the
   Categories school-tree sidebar. */
const SCHOOL_INFO = {
  ug:     { school: 'UG',     city: 'Accra' },
  knust:  { school: 'KNUST',  city: 'Kumasi' },
  ucc:    { school: 'UCC',    city: 'Cape Coast' },
  upsa:   { school: 'UPSA',   city: 'Accra' },
  ashesi: { school: 'Ashesi', city: 'Berekuso' },
};

const SELLERS = [
  {
    id: 's1',
    name: 'Kofi Gadgets',
    rating: 4.9,
    reviews: 120,
    verified: true,
    tagline: 'Phones · Laptops · Accessories',
    avatar:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 's2',
    name: "Ama's Boutique",
    rating: 4.8,
    reviews: 85,
    verified: true,
    tagline: 'Afro-chic fashion for students',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 's3',
    name: 'Yaw Electronics',
    rating: 4.7,
    reviews: 62,
    verified: false,
    tagline: 'Headphones, speakers & more',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  },
  {
    id: 's4',
    name: 'Legon Book Nook',
    rating: 4.6,
    reviews: 47,
    verified: true,
    tagline: 'Textbooks, novels & past papers',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
  },
  {
    id: 's5',
    name: 'Sneaker Spot GH',
    rating: 4.9,
    reviews: 98,
    verified: true,
    tagline: 'Authentic sneakers delivered on campus',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
];

const RECENT = [
  {
    id: 'r1',
    title: 'Nike Air Max Red',
    price: 650,
    tag: 'USED · LIKE NEW',
    campus: 'UG Legon',
    universityId: 'ug',
    location: 'Volta Hall',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r2',
    title: 'Beats Solo 3 Wireless',
    price: 1200,
    tag: 'BRAND NEW',
    campus: 'UPSA',
    universityId: 'upsa',
    location: 'Main Campus',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r3',
    title: 'MacBook Pro 2019',
    price: 7500,
    tag: 'USED · FAIR',
    campus: 'KNUST',
    universityId: 'knust',
    location: 'Republic Hall',
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=70',
  },
  {
    id: 'r4',
    title: 'Sony Alpha A6400',
    price: 5200,
    tag: 'REFURBISHED',
    campus: 'UG Legon',
    universityId: 'ug',
    location: 'Commonwealth Hall',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&auto=format&fit=crop&q=70',
  },
];

// Assign each product a category & seller so we can filter.
const PRODUCT_CATEGORIES = {
  t1: 'electronics', t2: 'electronics', t3: 'electronics',
  r1: 'fashion',     r2: 'electronics', r3: 'electronics', r4: 'electronics',
};
const PRODUCT_SELLERS = {
  t1: 's1', t2: 's1', t3: 's3',
  r1: 's5', r2: 's3', r3: 's1', r4: 's1',
};

const ALL_PRODUCTS = [...TRENDING, ...RECENT].map((p) => {
  const info = SCHOOL_INFO[p.universityId] || { school: 'Other', city: '' };
  return {
    ...p,
    school: info.school,
    city: info.city,
    categoryId: PRODUCT_CATEGORIES[p.id] || 'electronics',
    sellerId: PRODUCT_SELLERS[p.id] || 's1',
    description:
      'Carefully kept by a fellow student on campus. Ready for pickup or campus meet-up. Negotiation welcome — DM the seller via chat below.',
    images: [p.image, p.image, p.image],
  };
});

const CHATS = [
  {
    id: 'c1',
    sellerId: 's1',
    name: 'Kofi Gadgets',
    avatar: SELLERS[0].avatar,
    last: 'Yes, the iPad is still available.',
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
    last: 'Thanks for buying!',
    time: '1d',
    unread: 0,
  },
];

/* Chats from the SELLER's perspective.
   Each entry includes the buyer's name, campus location and the specific
   product the buyer is enquiring about so the seller can triage quickly. */
const SELLER_CHATS = [
  {
    id: 'sc1',
    buyerId: 'b1',
    buyerName: 'Akwasi Mensah',
    buyerLocation: 'UG Legon · Akuafo Hall',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80',
    productId: 't1',
    productTitle: 'iPad Pro 12.9"',
    productImage: TRENDING[0].image,
    last: 'Is this still available? Can I pick it up tomorrow?',
    time: '4m',
    unread: 3,
  },
  {
    id: 'sc2',
    buyerId: 'b2',
    buyerName: 'Adwoa Osei',
    buyerLocation: 'KNUST · Unity Hall',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    productId: 't2',
    productTitle: 'iPhone 13 128GB',
    productImage: TRENDING[1].image,
    last: 'Can you do GH₵ 3,600?',
    time: '32m',
    unread: 1,
  },
  {
    id: 'sc3',
    buyerId: 'b3',
    buyerName: 'Yaw Boateng',
    buyerLocation: 'UCC · Casford Hall',
    avatar:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80',
    productId: 't3',
    productTitle: 'Apple Watch SE',
    productImage: TRENDING[2].image,
    last: 'Thanks, transfer sent!',
    time: '2d',
    unread: 0,
  },
];

const MESSAGES = {
  c1: [
    { id: 1, from: 'them', text: 'Hello! Are you interested in the iPad?', time: '10:14' },
    { id: 2, from: 'me',   text: 'Yes, is it still available?',            time: '10:15' },
    { id: 3, from: 'them', text: 'Yes, the iPad is still available.',    time: '10:16' },
  ],
  c2: [
    { id: 1, from: 'me',   text: 'Hi! Where can we meet?', time: '09:00' },
    { id: 2, from: 'them', text: 'I can drop it at Night Market by 6pm', time: '09:05' },
  ],
  c3: [
    { id: 1, from: 'them', text: 'Thanks for buying!', time: 'Yesterday' },
  ],
};

const NOTIFICATIONS = {
  Today: [
    { id: 'n1', type: 'order',   title: 'Order confirmed', body: 'Your iPad Pro order is on its way.', time: '10m' },
    { id: 'n2', type: 'price',   title: 'Price drop',      body: 'iPhone 13 dropped to GH₵ 3,800',       time: '2h' },
  ],
  Yesterday: [
    { id: 'n3', type: 'message', title: 'New message',     body: "Ama's Boutique replied to you",       time: '1d' },
    { id: 'n4', type: 'review',  title: 'Leave a review',  body: 'How was your purchase from Kofi Gadgets?', time: '1d' },
  ],
};

export const sbay = {
  async getUniversities() { await wait(); return UNIVERSITIES; },
  async getCategories()   { await wait(); return CATEGORIES; },
  async getTrending()     { await wait(); return ALL_PRODUCTS.filter((p) => TRENDING.some((t) => t.id === p.id)); },
  async getSellers()      { await wait(); return SELLERS; },
  async getRecent()       { await wait(); return ALL_PRODUCTS.filter((p) => RECENT.some((r) => r.id === p.id)); },
  async getAllProducts()  { await wait(); return ALL_PRODUCTS; },
  async getProductsByCategory(catId) {
    await wait();
    if (!catId || catId === 'all') return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) => p.categoryId === catId);
  },
  async getProduct(id)    { await wait(); return ALL_PRODUCTS.find((p) => p.id === id) || ALL_PRODUCTS[0]; },
  async getSeller(id)     {
    await wait();
    const seller = SELLERS.find((s) => s.id === id) || SELLERS[0];
    return {
      ...seller,
      university: 'UG, Legon',
      verified: seller.verified ?? true,
      bio: seller.tagline || 'Selling lightly used campus gadgets since 2023.',
      listings: ALL_PRODUCTS.filter((p) => p.sellerId === seller.id),
    };
  },
  /* School tree used by the Categories sidebar:
     [{ id, label, city, categories: [CATEGORY] }, ... , { id: 'others', label: 'Others', categories: [CATEGORY] }]
     Categories under each school are derived from the products actually
     listed by sellers in that school. An 'Others' entry always appears
     at the end. */
  async getSchoolTree() {
    await wait();
    const schoolIds = Object.keys(SCHOOL_INFO);
    const tree = schoolIds.map((sid) => {
      const items = ALL_PRODUCTS.filter((p) => p.universityId === sid);
      const catIds = [...new Set(items.map((p) => p.categoryId))];
      return {
        id: sid,
        label: SCHOOL_INFO[sid].school,
        city: SCHOOL_INFO[sid].city,
        categories: CATEGORIES.filter((c) => c.id !== 'all' && catIds.includes(c.id)),
      };
    });
    const othersItems = ALL_PRODUCTS.filter((p) => !schoolIds.includes(p.universityId));
    const otherCatIds = [...new Set(othersItems.map((p) => p.categoryId))];
    tree.push({
      id: 'others',
      label: 'Others',
      city: '',
      categories: CATEGORIES.filter((c) => c.id !== 'all' && otherCatIds.includes(c.id)),
    });
    return tree;
  },
  async getProductsByScope({ schoolId, categoryId } = {}) {
    await wait();
    const schoolIds = Object.keys(SCHOOL_INFO);
    return ALL_PRODUCTS.filter((p) => {
      if (schoolId === 'others') {
        if (schoolIds.includes(p.universityId)) return false;
      } else if (schoolId) {
        if (p.universityId !== schoolId) return false;
      }
      if (categoryId && categoryId !== 'all') {
        if (p.categoryId !== categoryId) return false;
      }
      return true;
    });
  },
  async searchProducts(q) {
    await wait(150);
    if (!q) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) =>
      p.title.toLowerCase().includes(q.toLowerCase())
    );
  },
  async getChats()        { await wait(); return CHATS; },
  async getSellerChats()  { await wait(); return SELLER_CHATS; },
  async getMessages(id)   { await wait(); return MESSAGES[id] || []; },
  async getNotifications(){ await wait(); return NOTIFICATIONS; },
};
