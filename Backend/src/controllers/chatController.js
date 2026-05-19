import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToUser } from '../socket.js';

/**
 * Strict purchase-gating — a buyer may only chat a seller if at least
 * one Order exists between them. This is checked on every send, not
 * just on chat creation, so revoking access is as simple as cancelling
 * the relevant order(s).
 */
async function assertCanChat(buyerId, sellerId) {
  const hasOrder = await Order.exists({
    buyer: buyerId, seller: sellerId,
  });
  if (!hasOrder) {
    throw new HttpError(403, 'You can only chat a seller after placing an order with them.');
  }
}

/** GET /api/chats — chat list for the current user. */
export const listChats = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === 'seller';
  const filter = isSeller ? { seller: req.user._id } : { buyer: req.user._id };
  const chats = await Chat.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate('buyer', 'name avatar location')
    .populate('seller', 'name avatar sellerProfile')
    .populate({ path: 'orders', select: 'invoiceNumber status items.title items.image total' });
  res.json({ chats });
});

/** GET /api/chats/:id — full thread, marks unread as read for caller. */
export const getChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate('buyer', 'name avatar location')
    .populate('seller', 'name avatar sellerProfile')
    .populate({ path: 'orders', select: 'invoiceNumber status total items' });
  if (!chat) throw new HttpError(404, 'Chat not found');
  const uid = req.user._id.toString();
  const isBuyer = chat.buyer._id.toString() === uid;
  const isSeller = chat.seller._id.toString() === uid;
  if (!isBuyer && !isSeller && req.user.role !== 'admin') throw new HttpError(403, 'Forbidden');

  const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });

  if (isBuyer && chat.unreadByBuyer > 0) {
    chat.unreadByBuyer = 0; await chat.save();
  } else if (isSeller && chat.unreadBySeller > 0) {
    chat.unreadBySeller = 0; await chat.save();
  }

  res.json({ chat, messages });
});

/** POST /api/chats/:id/messages */
export const sendMessage = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) throw new HttpError(404, 'Chat not found');
  if (chat.closed) throw new HttpError(409, 'This chat has been closed.');

  const uid = req.user._id.toString();
  const isBuyer = chat.buyer.toString() === uid;
  const isSeller = chat.seller.toString() === uid;
  if (!isBuyer && !isSeller) throw new HttpError(403, 'Forbidden');

  // Re-check purchase gating on every send.
  await assertCanChat(chat.buyer, chat.seller);

  const text = (req.body.text || '').trim();
  if (!text) throw new HttpError(400, 'Message cannot be empty');

  const msg = await Message.create({
    chat: chat._id, sender: req.user._id, text,
  });

  chat.lastMessageAt = new Date();
  chat.lastMessagePreview = text.slice(0, 140);
  if (isBuyer) chat.unreadBySeller += 1; else chat.unreadByBuyer += 1;
  await chat.save();

  const recipient = isBuyer ? chat.seller : chat.buyer;
  emitToUser(recipient.toString(), 'message:new', {
    chatId: chat._id,
    messageId: msg._id,
    text: text.slice(0, 140),
    href: `/chat/${chat._id}`,
  });

  res.status(201).json({ message: msg });
});

/**
 * POST /api/chats/start — buyer-initiated chat.
 * Body: { sellerId }
 * Will fail unless the buyer has at least one order with that seller.
 */
export const startChat = asyncHandler(async (req, res) => {
  const { sellerId } = req.body;
  const seller = await User.findOne({ _id: sellerId, role: 'seller' });
  if (!seller) throw new HttpError(404, 'Seller not found');

  await assertCanChat(req.user._id, seller._id);

  const chat = await Chat.findOneAndUpdate(
    { buyer: req.user._id, seller: seller._id },
    { $setOnInsert: { buyer: req.user._id, seller: seller._id } },
    { upsert: true, new: true }
  );
  res.json({ chat });
});
