import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Chat } from '../models/Chat.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAdmins } from '../socket.js';

/** Update the current user's own profile. Role and restriction flags
 *  are NEVER editable here — those are admin-only. */
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'phone', 'location'];
  const patch = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }

  if (req.user.role === 'seller') {
    if (req.body.sellerProfile) {
      patch.sellerProfile = {
        ...(req.user.sellerProfile?.toObject?.() || req.user.sellerProfile || {}),
        storeName: req.body.sellerProfile.storeName?.trim(),
        bio: req.body.sellerProfile.bio?.trim(),
        location: req.body.sellerProfile.location?.trim() || patch.location,
      };
    }
    if (req.body.payout) {
      const account = String(req.body.payout.account || '').replace(/\D/g, '');
      if (account.length < 9 || account.length > 15) {
        throw new HttpError(400, 'Enter a valid payout phone or account number.');
      }
      patch.payout = {
        method: req.body.payout.method || 'mtn-momo',
        account,
        accountName: req.body.payout.accountName?.trim() || req.user.name,
        network: req.body.payout.network?.trim(),
        updatedAt: new Date(),
      };
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, patch, { new: true, runValidators: true });
  res.json({ user });
});

/**
 * Apply to become a seller. Submission is queued for admin review —
 * the user is granted the `seller` role straight away (so they can
 * start setting up their store) but `verification.status` is set to
 * `pending`. Buyers see a "pending review" badge on the seller's
 * profile until an admin verifies them.
 */
export const becomeSeller = asyncHandler(async (req, res) => {
  const {
    storeName, bio, isStudent, university, occupation, businessReg, location, payout,
    idCardUrl, // base64 data URL — accepted for v1; replace with S3 in prod
  } = req.body;

  const user = await User.findById(req.user._id);
  if (user.role === 'admin') throw new HttpError(400, 'Admins cannot also be sellers');

  // If the seller claims student status, the ID card is mandatory so
  // the verification queue is meaningful. Reject early instead of
  // creating an un-actionable application row.
  if (isStudent && !idCardUrl) {
    throw new HttpError(400, 'Please attach a clear photo of your student ID.');
  }
  // Cap the inline image size to ~3 MB worth of base64 (≈ 4 MB of data URL)
  // so abusers can't blow up the user document.
  if (idCardUrl && typeof idCardUrl === 'string' && idCardUrl.length > 4_400_000) {
    throw new HttpError(413, 'Student ID image is too large. Please upload a smaller photo.');
  }

  user.role = 'seller';
  user.sellerProfile = {
    storeName: storeName?.trim(),
    bio: bio?.trim(),
    location: location?.trim(),
  };
  const payoutAccount = String(payout?.account || '').replace(/\D/g, '');
  if (payoutAccount.length < 9 || payoutAccount.length > 15) {
    throw new HttpError(400, 'Enter a valid payout phone or account number.');
  }
  user.payout = {
    method: payout?.method || 'mtn-momo',
    account: payoutAccount,
    accountName: payout?.accountName?.trim() || user.name,
    network: payout?.network?.trim(),
    updatedAt: new Date(),
  };
  user.verification = {
    status: 'pending',
    submittedAt: new Date(),
    isStudent: !!isStudent,
    university: university?.trim(),
    occupation: occupation?.trim(),
    businessReg: businessReg?.trim(),
    idCardUrl: isStudent ? idCardUrl : undefined,
    idCardUploadedAt: isStudent && idCardUrl ? new Date() : undefined,
  };
  user.verified = false;
  await user.save();

  // Notify all admins in real time so the verification queue refreshes.
  emitToAdmins('verification:new', {
    userId: user._id.toString(),
    name: user.name,
    storeName: user.sellerProfile?.storeName,
    isStudent: !!isStudent,
    message: `${user.name || user.email} submitted a seller application${isStudent ? ' with student ID' : ''}.`,
  });

  res.json({ user });
});

/** Public seller profile view (with a slice of their listings). */
export const getSellerById = asyncHandler(async (req, res) => {
  const seller = await User.findOne({ _id: req.params.id, role: 'seller', restricted: false });
  if (!seller) throw new HttpError(404, 'Seller not found');

  const listings = await Product.find({ seller: seller._id, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(24);

  res.json({ seller, listings });
});

export const myNotifications = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 14 * 24 * 3600e3);
  const uid = req.user._id;
  const isSeller = req.user.role === 'seller';

  const [orders, chats] = await Promise.all([
    Order.find(isSeller ? { seller: uid, createdAt: { $gte: since } } : { buyer: uid, updatedAt: { $gte: since } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('buyer', 'name')
      .populate('seller', 'name sellerProfile'),
    Chat.find(isSeller ? { seller: uid } : { buyer: uid })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(20)
      .populate('buyer', 'name')
      .populate('seller', 'name sellerProfile'),
  ]);

  const items = [];
  for (const o of orders) {
    items.push({
      id: `order-${o._id}-${new Date(o.updatedAt || o.createdAt).getTime()}`,
      type: 'order',
      title: isSeller ? 'New order activity' : 'Order update',
      body: isSeller
        ? `${o.buyer?.name || 'A buyer'} placed or updated ${o.invoiceNumber}.`
        : `${o.invoiceNumber} is now ${o.status}.`,
      href: isSeller ? '/seller-dashboard?tab=sales' : '/profile?tab=orders',
      at: o.updatedAt || o.createdAt,
    });
  }

  for (const c of chats) {
    const unread = isSeller ? c.unreadBySeller : c.unreadByBuyer;
    if (!unread) continue;
    const other = isSeller ? c.buyer?.name : (c.seller?.sellerProfile?.storeName || c.seller?.name);
    items.push({
      id: `chat-${c._id}-${new Date(c.lastMessageAt || c.updatedAt).getTime()}`,
      type: 'message',
      title: 'New message',
      body: `${other || 'Someone'} sent you a message.`,
      href: `/chat/${c._id}`,
      at: c.lastMessageAt || c.updatedAt,
    });
  }

  if (isSeller && req.user.verification?.status && req.user.verification.status !== 'verified') {
    items.push({
      id: `verification-${req.user.verification.status}`,
      type: 'verification',
      title: 'Seller verification',
      body: req.user.verification.status === 'pending'
        ? 'Your seller verification is still under review.'
        : 'Your seller verification needs attention.',
      href: '/seller-dashboard',
      at: req.user.verification.reviewedAt || req.user.verification.submittedAt || req.user.updatedAt,
    });
  }

  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json({ items: items.slice(0, 30) });
});

/** Add a saved payment method (mock — no PCI). */
export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { brand, last4, holder, expiry, method } = req.body;
  const user = await User.findById(req.user._id);
  user.paymentMethods.push({ brand, last4, holder, expiry, method });
  await user.save();
  res.status(201).json({ user });
});

export const removePaymentMethod = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.paymentMethods.id(req.params.cardId)?.deleteOne();
  await user.save();
  res.json({ user });
});
