import crypto from 'crypto';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { PaymentSession } from '../models/PaymentSession.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Plan } from '../models/Plan.js';
import { Settings } from '../models/Settings.js';
import { Chat } from '../models/Chat.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAdmins, emitToUser } from '../socket.js';
import { env } from '../config/env.js';

const PAYSTACK_API = 'https://api.paystack.co';

async function paystackPost(path, body) {
  const resp = await fetch(`${PAYSTACK_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function paystackGet(path) {
  const resp = await fetch(`${PAYSTACK_API}${path}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  return resp.json();
}

async function reserveStock(productId, qty, session) {
  return Product.findOneAndUpdate(
    { _id: productId, status: 'active', stock: { $gte: qty } },
    { $inc: { stock: -qty, sold: qty } },
    { new: true, session }
  );
}

/**
 * Atomically fulfills a PaymentSession into real Orders.
 * Reduces stock only if payment is confirmed.
 * Called by both verifyPayment (user redirect) and paystackWebhook (server-side).
 */
async function fulfillPaymentSession(paymentSession, paystackData) {
  const mongoSession = await mongoose.startSession();
  const orders = [];

  try {
    await mongoSession.withTransaction(async () => {
      const items = paymentSession.items;
      const productIds = items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(mongoSession);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const reserved = [];
      for (const it of items) {
        const product = productMap.get(it.productId.toString());
        if (!product) throw new HttpError(404, 'A listed item could not be found');
        if (product.status !== 'active') throw new HttpError(409, `"${product.title}" is no longer available`);

        const updated = await reserveStock(product._id, it.qty, mongoSession);
        if (!updated) {
          throw new HttpError(409, `Only ${product.stock} of "${product.title}" left — not enough stock.`);
        }
        if (updated.stock === 0) {
          updated.status = 'sold_out';
          await updated.save({ session: mongoSession });
        }
        reserved.push({ product, qty: it.qty });
      }

      const settings = await Settings.getSingleton();
      const groups = new Map();
      for (const r of reserved) {
        const sid = r.product.seller.toString();
        if (!groups.has(sid)) groups.set(sid, []);
        groups.get(sid).push(r);
      }

      for (const [sellerId, group] of groups.entries()) {
        const sellerUser = await User.findById(sellerId).session(mongoSession);
        let feePct = settings.defaultEscrowFeePct;
        if (sellerUser?.subscription?.plan) {
          const plan = await Plan.findOne({ code: sellerUser.subscription.plan }).session(mongoSession);
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

        const [order] = await Order.create(
          [
            {
              buyer: paymentSession.buyer,
              seller: sellerUser._id,
              items: orderItems,
              subtotal, feePct, fee, total,
              method: 'escrow',
              status: 'pending',
              escrow: { status: 'held', heldAt: new Date() },
              payment: {
                provider: 'paystack',
                transactionId: paystackData?.data?.reference || paystackData?.reference || paymentSession.reference,
                paidAt: new Date(),
              },
              deliveryLocation: paymentSession.deliveryLocation,
              timeline: [
                {
                  at: new Date(),
                  actor: paymentSession.buyer,
                  kind: 'created',
                  detail: 'Order placed via Paystack; funds held in escrow.',
                },
              ],
            },
          ],
          { session: mongoSession }
        );

        await Chat.findOneAndUpdate(
          { buyer: paymentSession.buyer, seller: sellerUser._id },
          {
            $setOnInsert: { buyer: paymentSession.buyer, seller: sellerUser._id },
            $set: { closed: false, closedAt: null, closedReason: null },
            $addToSet: { orders: order._id },
          },
          { upsert: true, new: true, session: mongoSession }
        );

        orders.push(order);
      }

      paymentSession.status = 'paid';
      paymentSession.orders = orders.map((o) => o._id);
      paymentSession.paystackData = paystackData;
      await paymentSession.save({ session: mongoSession });
    });
  } finally {
    mongoSession.endSession();
  }

  return orders;
}

/**
 * POST /api/payments/initialize
 *
 * Validates the cart and calls Paystack to create a hosted payment page.
 * Returns the authorization_url to redirect the user to.
 * Stock is NOT reduced yet — only reserved after payment is confirmed.
 */
export const initializePayment = asyncHandler(async (req, res) => {
  const { items, deliveryLocation } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Cart is empty');
  if (!deliveryLocation?.trim()) throw new HttpError(400, 'Delivery location is required');

  for (const it of items) {
    if (!Number.isInteger(it.qty) || it.qty < 1) {
      throw new HttpError(400, 'Quantity must be a positive whole number');
    }
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const settings = await Settings.getSingleton();
  let subtotalPesewas = 0;

  for (const it of items) {
    const product = productMap.get(it.productId);
    if (!product) throw new HttpError(404, `Listing not found: ${it.productId}`);
    if (product.status !== 'active') throw new HttpError(409, `"${product.title}" is no longer available`);
    if (product.seller.toString() === req.user._id.toString()) {
      throw new HttpError(400, 'You cannot buy your own listing');
    }
    if (product.stock < it.qty) {
      throw new HttpError(409, `Only ${product.stock} of "${product.title}" left`);
    }
    subtotalPesewas += Math.round(product.price * it.qty * 100);
  }

  const feePesewas = Math.round(subtotalPesewas * (settings.defaultEscrowFeePct / 100));
  const totalPesewas = subtotalPesewas + feePesewas;

  const reference = `SBAY-${Date.now()}-${nanoid(8)}`;

  const paystackRes = await paystackPost('/transaction/initialize', {
    email: req.user.email,
    amount: totalPesewas,
    reference,
    currency: 'GHS',
    callback_url: env.PAYSTACK_CALLBACK_URL,
    metadata: {
      buyer_id: req.user._id.toString(),
      buyer_name: req.user.name,
      item_count: items.length,
      cancel_action: env.PAYSTACK_CALLBACK_URL.replace('/payment-success', '/payment-failed'),
    },
  });

  if (!paystackRes.status || !paystackRes.data?.authorization_url) {
    throw new HttpError(502, paystackRes.message || 'Could not initialize payment. Please try again.');
  }

  await PaymentSession.create({
    reference,
    buyer: req.user._id,
    items: items.map((it) => ({ productId: it.productId, qty: it.qty })),
    deliveryLocation: deliveryLocation.trim(),
    amountPesewas: totalPesewas,
  });

  res.json({ authorization_url: paystackRes.data.authorization_url, reference });
});

/**
 * POST /api/payments/verify
 *
 * Called by the frontend after Paystack redirects back.
 * Verifies the transaction with Paystack, then atomically creates orders
 * and reduces stock — only if payment was successful.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.body;
  if (!reference) throw new HttpError(400, 'Payment reference is required');

  // If session already paid, return existing orders (handles page refresh)
  const existingPaid = await PaymentSession.findOne({ reference, status: 'paid' }).populate('orders');
  if (existingPaid?.orders?.length > 0) {
    return res.json({ orders: existingPaid.orders });
  }

  // Atomically claim the session to prevent race with webhook
  const session = await PaymentSession.findOneAndUpdate(
    { reference, buyer: req.user._id, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: false }
  );

  if (!session) {
    const ps = await PaymentSession.findOne({ reference });
    if (!ps) throw new HttpError(404, 'Payment session not found');
    if (ps.status === 'failed') throw new HttpError(400, 'This payment was not successful');
    if (ps.status === 'processing') {
      // Webhook may be processing — wait a moment and return pending
      return res.json({ orders: [], pending: true });
    }
    throw new HttpError(403, 'This payment does not belong to your account');
  }

  const paystackRes = await paystackGet(`/transaction/verify/${encodeURIComponent(reference)}`);

  if (!paystackRes.status || paystackRes.data?.status !== 'success') {
    await PaymentSession.findOneAndUpdate({ reference }, { $set: { status: 'failed' } });
    throw new HttpError(400, 'Payment was not completed. No funds were charged.');
  }

  try {
    const orders = await fulfillPaymentSession(session, paystackRes);
    emitToAdmins('order:new', {
      count: orders.length,
      total: orders.reduce((s, o) => s + (o.total || 0), 0),
      message: `${orders.length} new order${orders.length === 1 ? '' : 's'} just came in.`,
    });
    for (const o of orders) {
      if (o.seller) emitToUser(o.seller.toString(), 'order:new', { orderId: o._id });
    }
    res.json({ orders });
  } catch (err) {
    await PaymentSession.findOneAndUpdate({ reference }, { $set: { status: 'pending' } });
    throw err;
  }
});

/**
 * POST /api/payments/webhook
 *
 * Paystack server-to-server event delivery. Acts as a reliability
 * fallback — if the user closed the tab before being redirected,
 * the webhook still fulfills the order.
 *
 * req.rawBody is set by app.js via the express.json verify callback.
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!signature) return res.status(400).end();

  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');

  if (hash !== signature) return res.status(400).end();

  res.sendStatus(200);

  const { event, data } = req.body;
  if (event !== 'charge.success') return;

  const reference = data?.reference;
  if (!reference) return;

  const existingPaid = await PaymentSession.findOne({ reference, status: 'paid' });
  if (existingPaid) return;

  const session = await PaymentSession.findOneAndUpdate(
    { reference, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: false }
  );

  if (!session) return;

  try {
    const orders = await fulfillPaymentSession(session, { data });
    emitToAdmins('order:new', {
      count: orders.length,
      total: orders.reduce((s, o) => s + (o.total || 0), 0),
      message: `${orders.length} new order${orders.length === 1 ? '' : 's'} arrived via webhook.`,
    });
    for (const o of orders) {
      if (o.seller) emitToUser(o.seller.toString(), 'order:new', { orderId: o._id });
    }
  } catch {
    await PaymentSession.findOneAndUpdate({ reference }, { $set: { status: 'pending' } });
  }
});
