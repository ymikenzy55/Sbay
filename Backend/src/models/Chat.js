import mongoose from 'mongoose';

/**
 * Chat (1-to-1) between a buyer and a seller.
 *
 * Two business rules enforced at the controller layer:
 *
 *   1. A buyer can only START a chat with a seller after placing at
 *      least one Order with that seller (gating).
 *   2. Once both parties have confirmed (buyer "received", seller
 *      "delivered") on every linked order, the chat is auto-closed and
 *      no new messages may be posted.
 */
const chatSchema = new mongoose.Schema(
  {
    buyer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Orders this chat covers. We close the chat when every linked order
    // has dual confirmation. If a new order is placed later, that order
    // re-opens the chat (we push a fresh order id onto this array).
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

    closed: { type: Boolean, default: false, index: true },
    closedAt: Date,
    closedReason: String,

    lastMessageAt: Date,
    lastMessagePreview: String,

    unreadByBuyer:  { type: Number, default: 0 },
    unreadBySeller: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatSchema.index({ buyer: 1, seller: 1 }, { unique: true });

export const Chat = mongoose.model('Chat', chatSchema);
