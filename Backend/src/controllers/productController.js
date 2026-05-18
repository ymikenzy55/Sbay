import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function toTitleCase(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text === text.toUpperCase()) return text;
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** GET /api/products/catalog — DB-driven categories and school groups. */
export const listCatalogMeta = asyncHandler(async (_req, res) => {
  const items = await Product.find({ status: 'active' })
    .select('school city category')
    .lean();

  const categories = new Map();
  const schools = new Map();

  for (const item of items) {
    const categoryRaw = String(item.category || '').trim();
    const categoryKey = categoryRaw.toLowerCase();
    const schoolRaw = String(item.school || '').trim();
    const schoolKey = schoolRaw ? schoolRaw.toLowerCase() : 'others';
    const cityRaw = String(item.city || '').trim();

    if (categoryRaw) {
      const currentCategory = categories.get(categoryKey) || {
        id: categoryKey,
        label: toTitleCase(categoryRaw),
        count: 0,
      };
      currentCategory.count += 1;
      categories.set(categoryKey, currentCategory);
    }

    const currentSchool = schools.get(schoolKey) || {
      id: schoolKey,
      label: schoolRaw ? toTitleCase(schoolRaw) : 'Others',
      city: cityRaw || '',
      count: 0,
      categories: new Map(),
    };

    currentSchool.count += 1;
    if (cityRaw && !currentSchool.city) currentSchool.city = cityRaw;

    if (categoryRaw) {
      const currentSchoolCategory = currentSchool.categories.get(categoryKey) || {
        id: categoryKey,
        label: toTitleCase(categoryRaw),
        count: 0,
      };
      currentSchoolCategory.count += 1;
      currentSchool.categories.set(categoryKey, currentSchoolCategory);
    }

    schools.set(schoolKey, currentSchool);
  }

  res.json({
    total: items.length,
    categories: Array.from(categories.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    schools: Array.from(schools.values()).map((school) => ({
      id: school.id,
      label: school.label,
      city: school.city,
      count: school.count,
      categories: Array.from(school.categories.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  });
});

/** GET /api/products — public list with filters, search, pagination. */
export const listProducts = asyncHandler(async (req, res) => {
  const {
    q, category, seller, school, city,
    minPrice, maxPrice, condition,
    sort = 'recent', page = 1, limit = 24,
  } = req.query;

  const filter = { status: 'active' };
  if (category) filter.category = category;
  if (seller) filter.seller = seller;
  if (school) filter.school = school;
  if (city) filter.city = city;
  if (condition) filter.condition = condition;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (q) filter.$text = { $search: q };

  const sortMap = {
    recent:    { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc:{ price: -1 },
    popular:   { views: -1 },
  };

  const lim = Math.min(Number(limit) || 24, 60);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.recent)
      .skip(skip).limit(lim)
      .populate('seller', 'name avatar sellerProfile verified location'),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: lim });
});

/** GET /api/products/:id — single listing + bumps view count. */
export const getProduct = asyncHandler(async (req, res) => {
  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: 'removed' } },
    { $inc: { views: 1 } },
    { new: true }
  ).populate('seller', 'name avatar sellerProfile verified location createdAt');

  if (!p) throw new HttpError(404, 'Product not found');
  res.json({ product: p });
});

/** POST /api/products — sellers only. */
export const createProduct = asyncHandler(async (req, res) => {
  const seller = req.user;
  if (seller.role !== 'seller') throw new HttpError(403, 'Only sellers can create listings');

  const {
    title, description, price, discountPrice,
    stock, condition, category, images, location, school, city,
  } = req.body;

  const product = await Product.create({
    seller: seller._id,
    title, description,
    price, discountPrice,
    stock: stock ?? 1,
    condition, category,
    images: Array.isArray(images) ? images : [],
    location: location || seller.sellerProfile?.location || seller.location,
    school, city,
  });

  res.status(201).json({ product });
});

/** PATCH /api/products/:id — seller may only edit their own. */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'You can only edit your own listings');
  }

  const allowed = [
    'title', 'description', 'price', 'discountPrice', 'stock',
    'condition', 'category', 'images', 'location', 'school', 'city',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) product[k] = req.body[k];
  }
  if (product.stock > 0 && product.status === 'sold_out') product.status = 'active';
  await product.save();

  res.json({ product });
});

/** DELETE /api/products/:id — soft delete, sets status='removed'. */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'You can only delete your own listings');
  }
  product.status = 'removed';
  await product.save();
  res.json({ ok: true });
});

/** GET /api/products/mine — seller's own listings (any status). */
export const myListings = asyncHandler(async (req, res) => {
  const items = await Product.find({ seller: req.user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 });
  res.json({ items });
});
