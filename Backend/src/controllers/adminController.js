import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Plan } from '../models/Plan.js';
import { Settings } from '../models/Settings.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { AuditLog } from '../models/AuditLog.js';
import { signAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';

/* ----------------------- Admin Auth ----------------------- */

/**
 * POST {adminPrefix}/auth/login
 *
 * Same credential mechanism as the regular login, but ONLY admin
 * accounts succeed here. Non-admins receive the same vague 401 to
 * avoid leaking the existence of regular accounts via this endpoint.
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || user.role !== 'admin') throw new HttpError(401, 'Invalid credentials');

  const ok = await user.checkPassword(password);
  if (!ok) throw new HttpError(401, 'Invalid credentials');
  if (user.restricted) throw new HttpError(403, 'Account is restricted');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAccessToken(user);
  audit(req, 'admin.login', { kind: 'user', id: user._id });
  res.json({ token, user });
});

/* ----------------------- Dashboard ------------------------ */

export const dashboard = asyncHandler(async (_req, res) => {
  const [
    userCount, buyerCount, sellerCount, adminCount,
    productCount, activeProductCount,
    orderCount, completedOrders,
    revenueAgg, escrowAgg, salesByDayAgg,
    pendingVerifications, restrictedCount,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'admin' }),
    Product.countDocuments({ status: { $ne: 'removed' } }),
    Product.countDocuments({ status: 'active' }),
    Order.countDocuments({}),
    Order.countDocuments({ status: 'completed' }),
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, fees: { $sum: '$fee' } } },
    ]),
    Order.aggregate([
      { $match: { 'escrow.status': 'held' } },
      { $group: { _id: null, held: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 3600e3) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        gmv: { $sum: '$total' },
      } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ 'verification.status': 'pending' }),
    User.countDocuments({ restricted: true }),
  ]);

  res.json({
    users: { total: userCount, buyers: buyerCount, sellers: sellerCount, admins: adminCount, restricted: restrictedCount },
    products: { total: productCount, active: activeProductCount },
    orders: { total: orderCount, completed: completedOrders },
    revenue: revenueAgg[0] || { revenue: 0, fees: 0 },
    escrow: escrowAgg[0] || { held: 0, count: 0 },
    salesByDay: salesByDayAgg,
    pendingVerifications,
  });
});

/* ----------------------- Users ------------------------ */

export const listUsers = asyncHandler(async (req, res) => {
  const { q, role, restricted, verified, page = 1, limit = 30, sort = 'recent' } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (restricted === 'true') filter.restricted = true;
  if (restricted === 'false') filter.restricted = false;
  if (verified === 'true') filter.verified = true;
  if (verified === 'false') filter.verified = false;
  if (q) {
    filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  const lim = Math.min(Number(limit) || 30, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const sortMap = { recent: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 } };

  const [items, total] = await Promise.all([
    User.find(filter).sort(sortMap[sort] || sortMap.recent).skip(skip).limit(lim),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), limit: lim });
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');

  const [listings, orders, sales] = await Promise.all([
    Product.find({ seller: user._id }).sort({ createdAt: -1 }).limit(50),
    Order.find({ buyer: user._id }).sort({ createdAt: -1 }).limit(50),
    Order.find({ seller: user._id }).sort({ createdAt: -1 }).limit(50),
  ]);

  res.json({ user, listings, orders, sales });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body; // 'approved' | 'rejected'
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');

  if (decision === 'approved') {
    user.verified = true;
    user.verification.status = 'verified';
  } else if (decision === 'rejected') {
    user.verified = false;
    user.verification.status = 'rejected';
    user.verification.reason = reason;
  } else {
    throw new HttpError(400, 'decision must be "approved" or "rejected"');
  }
  user.verification.reviewedAt = new Date();
  user.verification.reviewedBy = req.user._id;
  await user.save();

  audit(req, 'user.verify', { kind: 'user', id: user._id }, { decision, reason });
  res.json({ user });
});

export const restrictUser = asyncHandler(async (req, res) => {
  const { restricted, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
    throw new HttpError(400, 'You cannot restrict your own admin account.');
  }
  user.restricted = !!restricted;
  user.restrictReason = restricted ? (reason || 'Restricted by admin') : undefined;
  user.restrictedAt = restricted ? new Date() : undefined;
  user.restrictedBy = restricted ? req.user._id : undefined;
  await user.save();

  audit(req, restricted ? 'user.restrict' : 'user.unrestrict', { kind: 'user', id: user._id }, { reason });
  res.json({ user });
});

/* ----------------------- Admin Management ------------------------ */

export const listAdmins = asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
  res.json({ admins });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new HttpError(409, 'An account with this email already exists');
  const passwordHash = await User.hashPassword(password);
  const admin = await User.create({
    name, email: email.toLowerCase(), passwordHash, role: 'admin', verified: true,
  });
  audit(req, 'admin.create', { kind: 'user', id: admin._id });
  res.status(201).json({ admin });
});

export const removeAdmin = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new HttpError(400, 'You cannot remove yourself.');
  }
  const remainingAdmins = await User.countDocuments({ role: 'admin' });
  if (remainingAdmins <= 1) throw new HttpError(400, 'Cannot remove the last remaining admin.');

  const target = await User.findOne({ _id: req.params.id, role: 'admin' });
  if (!target) throw new HttpError(404, 'Admin not found');

  // We demote rather than delete — preserves audit history.
  target.role = 'buyer';
  await target.save();
  audit(req, 'admin.remove', { kind: 'user', id: target._id });
  res.json({ ok: true });
});

/* ----------------------- Products ------------------------ */

export const listAllProducts = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.title = { $regex: q, $options: 'i' };
  const lim = Math.min(Number(limit) || 30, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('seller', 'name email'),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total });
});

export const moderateProduct = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // 'hide' | 'unhide' | 'remove'
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (action === 'hide')   product.status = 'hidden';
  else if (action === 'unhide') product.status = product.stock > 0 ? 'active' : 'sold_out';
  else if (action === 'remove') { product.status = 'removed'; product.removedReason = reason; product.removedBy = req.user._id; }
  else throw new HttpError(400, 'Invalid action');
  await product.save();
  audit(req, `product.${action}`, { kind: 'product', id: product._id }, { reason });
  res.json({ product });
});

/* ----------------------- Orders & Escrow ------------------------ */

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, escrowStatus, q, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (escrowStatus) filter['escrow.status'] = escrowStatus;
  if (q) filter.invoiceNumber = { $regex: q, $options: 'i' };
  const lim = Math.min(Number(limit) || 30, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(lim)
      .populate('buyer', 'name email')
      .populate('seller', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  if (o.escrow.status !== 'held') throw new HttpError(409, 'Escrow is not in a held state');
  o.escrow.status = 'released';
  o.escrow.releasedAt = new Date();
  o.escrow.releasedBy = req.user._id;
  o.status = 'completed';
  o.timeline.push({ at: new Date(), actor: req.user._id, kind: 'escrow', detail: 'Escrow released by admin' });
  await o.save();
  audit(req, 'escrow.release', { kind: 'order', id: o._id });
  res.json({ order: o });
});

export const refundEscrow = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  if (o.escrow.status !== 'held') throw new HttpError(409, 'Escrow is not in a held state');

  // Restore stock
  for (const it of o.items) {
    await Product.findByIdAndUpdate(it.product, { $inc: { stock: it.qty, sold: -it.qty } });
  }
  o.escrow.status = 'refunded';
  o.escrow.refundedAt = new Date();
  o.escrow.refundedBy = req.user._id;
  o.escrow.reason = reason;
  o.status = 'canceled';
  o.timeline.push({ at: new Date(), actor: req.user._id, kind: 'escrow', detail: `Escrow refunded by admin: ${reason}` });
  await o.save();
  audit(req, 'escrow.refund', { kind: 'order', id: o._id }, { reason });
  res.json({ order: o });
});

/* ----------------------- Plans (subscription pricing) ------------------------ */

export const listAllPlans = asyncHandler(async (_req, res) => {
  const plans = await Plan.find({}).sort({ sortOrder: 1, price: 1 });
  res.json({ plans });
});

export const upsertPlan = asyncHandler(async (req, res) => {
  const { code, name, tag, price, feePct, features, highlight, active, sortOrder } = req.body;
  const plan = await Plan.findOneAndUpdate(
    { code: code.toLowerCase() },
    { code: code.toLowerCase(), name, tag, price, feePct, features, highlight, active, sortOrder },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  audit(req, 'plan.upsert', { kind: 'plan', id: plan._id }, { code, price, feePct });
  res.json({ plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findByIdAndDelete(req.params.id);
  if (!plan) throw new HttpError(404, 'Plan not found');
  audit(req, 'plan.delete', { kind: 'plan', id: plan._id });
  res.json({ ok: true });
});

/* ----------------------- Settings ------------------------ */

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['platformName', 'defaultEscrowFeePct', 'supportEmail', 'announcement', 'maintenanceMode'];
  const settings = await Settings.getSingleton();
  for (const k of allowed) {
    if (req.body[k] !== undefined) settings[k] = req.body[k];
  }
  await settings.save();
  audit(req, 'settings.update', { kind: 'settings' }, req.body);
  res.json({ settings });
});

/* ----------------------- Audit log ------------------------ */

export const listAuditLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action } = req.query;
  const filter = {};
  if (action) filter.action = action;
  const lim = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('actor', 'name email'),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ items, total });
});

/* ----------------------- Reports ------------------------ */

export const salesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: 'completed' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to)   match.createdAt.$lte = new Date(to);
  }
  const [byDay, bySeller, byCategory] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          gmv: { $sum: '$total' }, fees: { $sum: '$fee' }, orders: { $sum: 1 },
        } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: '$seller', gmv: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { gmv: -1 } }, { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
      { $unwind: '$seller' },
      { $project: { gmv: 1, orders: 1, sellerName: '$seller.name', sellerEmail: '$seller.email' } },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$p.category', gmv: { $sum: { $multiply: ['$items.price', '$items.qty'] } }, units: { $sum: '$items.qty' } } },
      { $sort: { gmv: -1 } },
    ]),
  ]);
  res.json({ byDay, bySeller, byCategory });
});

/* ----------------------- Chat moderation ------------------------ */

export const listAllChats = asyncHandler(async (req, res) => {
  const { closed, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (closed === 'true') filter.closed = true;
  if (closed === 'false') filter.closed = false;
  const lim = Math.min(Number(limit) || 30, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Chat.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(lim)
      .populate('buyer', 'name email').populate('seller', 'name email'),
    Chat.countDocuments(filter),
  ]);
  res.json({ items, total });
});

export const getAdminChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate('buyer', 'name email').populate('seller', 'name email')
    .populate('orders');
  if (!chat) throw new HttpError(404, 'Chat not found');
  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 }).populate('sender', 'name role');
  res.json({ chat, messages });
});

export const closeChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) throw new HttpError(404, 'Chat not found');
  chat.closed = true;
  chat.closedAt = new Date();
  chat.closedReason = req.body?.reason || 'Closed by admin';
  await chat.save();
  audit(req, 'chat.close', { kind: 'chat', id: chat._id });
  res.json({ chat });
});
