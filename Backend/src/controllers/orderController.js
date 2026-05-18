import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Plan } from '../models/Plan.js';
import { Settings } from '../models/Settings.js';
import { Chat } from '../models/Chat.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAdmins, emitToUser } from '../socket.js';

/**
 * Atomically reserve `qty` units of a product. Returns the updated
 * product or null if there isn't enough stock. This is the answer to
 * the "two users buy the last unit at the same time" race — Mongo's
 * findOneAndUpdate is atomic, so exactly one of the two updates
 * matches the `stock >= qty` predicate; the other gets null and is
 * told the item is out of stock.
 */
async function reserveStock(productId, qty, session) {
  return Product.findOneAndUpdate(
    { _id: productId, status: 'active', stock: { $gte: qty } },
    { $inc: { stock: -qty, sold: qty } },
    { new: true, session }
  );
}

async function restoreStock(productId, qty, session) {
  return Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { stock: qty, sold: -qty } },
    { new: true, session }
  );
}

function pushTimeline(order, actor, kind, detail) {
  order.timeline.push({ at: new Date(), actor, kind, detail });
}

/**
 * POST /api/orders/checkout
 *
 * Body: { items: [{ productId, qty }], paymentMethod: { brand, last4, holder } }
 *
 * Flow:
 *   1. Pull each product, validate qty/stock.
 *   2. Atomically decrement stock per product. Any failure → rollback.
 *   3. Group items by seller into one Order each (so one cart can spin
 *      up multiple orders if it spans sellers).
 *   4. Compute fee from the seller's current plan (or platform default).
 *   5. Mark each Order as paid + escrow held.
 */
export const checkout = asyncHandler(async (req, res) => {
  const { items, payment } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Cart is empty');
  }

  // Sanity-clamp quantities — a defence-in-depth guard. Validators on
  // the route also reject these, but we never want to be the system
  // that processes "qty: -3".
  for (const it of items) {
    if (!Number.isInteger(it.qty) || it.qty < 1) {
      throw new HttpError(400, 'Quantity must be a positive whole number');
    }
  }

  const session = await mongoose.startSession();
  const orders = [];

  try {
    await session.withTransaction(async () => {
      // 1. Load products, group by seller
      const productIds = items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // 2. Reserve stock atomically (per item). On failure we rollback.
      const reserved = [];
      for (const it of items) {
        const product = productMap.get(it.productId);
        if (!product) throw new HttpError(404, `Listing not found: ${it.productId}`);
        if (product.status !== 'active') throw new HttpError(409, `${product.title} is no longer available`);
        if (product.seller.toString() === req.user._id.toString()) {
          throw new HttpError(400, 'You cannot buy your own listing');
        }

        const updated = await reserveStock(product._id, it.qty, session);
        if (!updated) {
          throw new HttpError(409, `Sorry — only ${product.stock} of "${product.title}" left.`);
        }
        // If we just sold the last unit, mark sold_out.
        if (updated.stock === 0) {
          updated.status = 'sold_out';
          await updated.save({ session });
        }
        reserved.push({ product, updated, qty: it.qty });
      }

      // 3. Group by seller
      const settings = await Settings.getSingleton();
      const groups = new Map();
      for (const r of reserved) {
        const sid = r.product.seller.toString();
        if (!groups.has(sid)) groups.set(sid, []);
        groups.get(sid).push(r);
      }

      // 4. Build one Order per seller
      for (const [sellerId, group] of groups.entries()) {
        const sellerUser = await User.findById(sellerId).session(session);
        let feePct = settings.defaultEscrowFeePct;
        if (sellerUser?.subscription?.plan) {
          const plan = await Plan.findOne({ code: sellerUser.subscription.plan }).session(session);
          if (plan) feePct = plan.feePct;
        }

        const subtotal = group.reduce((s, g) => s + g.product.price * g.qty, 0);
        const fee = Math.round(subtotal * feePct) / 100;
        const total = subtotal + fee;

        const orderItems = group.map((g) => ({
          product: g.product._id,
          title: g.product.title,
          image: g.product.images?.[0],
          price: g.product.price,
          qty: g.qty,
          seller: g.product.seller,
        }));

        const [order] = await Order.create([{
          buyer: req.user._id,
          seller: sellerUser._id,
          items: orderItems,
          subtotal, feePct, fee, total,
          method: 'escrow',
          status: 'pending',
          escrow: { status: 'held', heldAt: new Date() },
          payment: {
            provider: 'sbay-mock',
            transactionId: `MOCK-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            cardBrand: payment?.brand,
            cardLast4: payment?.last4,
            paidAt: new Date(),
          },
          deliveryLocation: req.user.location,
          timeline: [{
            at: new Date(),
            actor: req.user._id,
            kind: 'created',
            detail: 'Order placed; funds held in escrow.',
          }],
        }], { session });

        // Open / extend the buyer↔seller chat, attaching this order.
        await Chat.findOneAndUpdate(
          { buyer: req.user._id, seller: sellerUser._id },
          {
            $setOnInsert: { buyer: req.user._id, seller: sellerUser._id },
            $set: { closed: false, closedAt: null, closedReason: null },
            $addToSet: { orders: order._id },
          },
          { upsert: true, new: true, session }
        );

        orders.push(order);
      }
    });
  } finally {
    session.endSession();
  }

  // Notify admins + each seller in real time.
  emitToAdmins('order:new', {
    count: orders.length,
    total: orders.reduce((s, o) => s + (o.total || 0), 0),
    message: `${orders.length} new order${orders.length === 1 ? '' : 's'} just came in.`,
  });
  for (const o of orders) {
    if (o.seller) emitToUser(o.seller.toString(), 'order:new', { orderId: o._id });
  }

  res.status(201).json({ orders });
});

/** GET /api/orders/mine — buyer's own orders. */
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('seller', 'name avatar sellerProfile');
  res.json({ orders });
});

/** GET /api/orders/sales — seller's incoming orders. */
export const mySales = asyncHandler(async (req, res) => {
  const orders = await Order.find({ seller: req.user._id })
    .sort({ createdAt: -1 })
    .populate('buyer', 'name avatar location');
  res.json({ orders });
});

/** GET /api/orders/:id — only buyer, seller, or admin may view. */
export const getOrder = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id)
    .populate('buyer', 'name avatar location email')
    .populate('seller', 'name avatar sellerProfile email');
  if (!o) throw new HttpError(404, 'Order not found');
  const uid = req.user._id.toString();
  const allowed = (
    o.buyer._id.toString() === uid ||
    o.seller._id.toString() === uid ||
    req.user.role === 'admin'
  );
  if (!allowed) throw new HttpError(403, 'Forbidden');
  res.json({ order: o });
});

const ALLOWED_BY_SELLER = new Set(['processing', 'shipped', 'delivered']);

/**
 * PATCH /api/orders/:id/status — seller-driven status transitions.
 * Mark-delivered also flips `sellerConfirmedDelivery`.
 */
export const updateStatusBySeller = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  if (o.seller.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Only the seller can change this order');
  }
  if (!ALLOWED_BY_SELLER.has(status)) {
    throw new HttpError(400, `Sellers may only transition to: ${[...ALLOWED_BY_SELLER].join(', ')}`);
  }
  if (['completed', 'canceled'].includes(o.status)) {
    throw new HttpError(409, 'Order is already finalised');
  }
  o.status = status;
  if (status === 'delivered') o.sellerConfirmedDelivery = true;
  pushTimeline(o, req.user._id, 'status', `Seller set status to ${status}`);
  await o.save();
  await maybeCloseChat(o);
  res.json({ order: o });
});

/**
 * POST /api/orders/:id/confirm-receipt — buyer confirms.
 * Releases escrow and marks order completed.
 */
export const buyerConfirmReceipt = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  if (o.buyer.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Only the buyer can confirm receipt');
  }
  if (o.escrow.status !== 'held') {
    throw new HttpError(409, 'Escrow is not in a held state');
  }
  o.buyerConfirmedReceipt = true;
  o.status = 'completed';
  o.escrow.status = 'released';
  o.escrow.releasedAt = new Date();
  o.escrow.releasedBy = req.user._id;
  pushTimeline(o, req.user._id, 'escrow', 'Buyer confirmed receipt; escrow released to seller.');
  await o.save();
  await maybeCloseChat(o);
  res.json({ order: o });
});

/**
 * POST /api/orders/:id/cancel — only valid before processing/shipping
 * starts. Restores stock, refunds escrow.
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new HttpError(404, 'Order not found');
  const uid = req.user._id.toString();
  const isParty = o.buyer.toString() === uid || o.seller.toString() === uid;
  if (!isParty && req.user.role !== 'admin') throw new HttpError(403, 'Forbidden');
  if (!['pending', 'processing'].includes(o.status)) {
    throw new HttpError(409, `Cannot cancel an order in '${o.status}' state`);
  }
  for (const it of o.items) {
    await restoreStock(it.product, it.qty);
  }
  o.status = 'canceled';
  o.escrow.status = 'refunded';
  o.escrow.refundedAt = new Date();
  o.escrow.refundedBy = req.user._id;
  o.escrow.reason = req.body?.reason || 'Order canceled';
  pushTimeline(o, req.user._id, 'status', `Order canceled and stock restored.`);
  await o.save();
  res.json({ order: o });
});

/**
 * Close the buyer↔seller chat once every linked order has dual
 * confirmation (delivered + received). The chat reopens automatically
 * if a fresh order is later placed (see checkout flow).
 */
async function maybeCloseChat(order) {
  const chat = await Chat.findOne({ buyer: order.buyer, seller: order.seller });
  if (!chat || chat.closed) return;
  const linked = await Order.find({
    _id: { $in: chat.orders },
    status: { $nin: ['canceled'] },
  });
  if (linked.length === 0) return;
  const allDualConfirmed = linked.every(
    (o) => o.buyerConfirmedReceipt && o.sellerConfirmedDelivery
  );
  if (allDualConfirmed) {
    chat.closed = true;
    chat.closedAt = new Date();
    chat.closedReason = 'Dual confirmation on all orders';
    await chat.save();
  }
}
