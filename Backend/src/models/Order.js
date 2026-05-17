import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const invoiceId = customAlphabet('0123456789', 8);

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'canceled'];

const orderItemSchema = new mongoose.Schema(
  {
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title:     { type: String, required: true },
    image:     String,
    price:     { type: Number, required: true, min: 0 }, // captured at purchase
    qty:       { type: Number, required: true, min: 1 },
    seller:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

/**
 * Order.
 *
 * One order is for one seller (so the cart is split per seller at
 * checkout). Funds are held in escrow until either:
 *   1. the buyer confirms receipt, OR
 *   2. an admin releases / refunds the escrow.
 *
 * `buyerConfirmedReceipt` + `sellerConfirmedDelivery` are the gates
 * for closing the chat between the two parties.
 */
const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String, unique: true, index: true,
      default: () => `SB-${invoiceId()}`,
    },

    buyer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items:  { type: [orderItemSchema], default: [] },

    subtotal: { type: Number, required: true, min: 0 },
    feePct:   { type: Number, required: true, min: 0, default: 0 }, // platform fee % captured at order time
    fee:      { type: Number, required: true, min: 0, default: 0 },
    total:    { type: Number, required: true, min: 0 },

    method: { type: String, enum: ['escrow'], default: 'escrow' },

    status: {
      type: String, enum: ORDER_STATUSES, default: 'pending', index: true,
    },

    escrow: {
      status: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
      heldAt:    { type: Date, default: Date.now },
      releasedAt: Date,
      releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // buyer or admin
      refundedAt: Date,
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
    },

    payment: {
      // Mock payment record. A real PSP integration would store the
      // gateway's transaction id, not a card number.
      provider: { type: String, default: 'sbay-mock' },
      transactionId: String,
      cardBrand: String,
      cardLast4: String,
      paidAt: Date,
    },

    buyerConfirmedReceipt: { type: Boolean, default: false },
    sellerConfirmedDelivery: { type: Boolean, default: false },

    deliveryLocation: String, // copied from product/buyer at order time
    notes: String,

    timeline: [
      {
        at: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        kind: String,    // 'created' | 'status' | 'escrow' | 'note'
        detail: String,
      },
    ],
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
