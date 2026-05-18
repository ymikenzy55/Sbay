import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Update the current user's own profile. Role and restriction flags
 *  are NEVER editable here — those are admin-only. */
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'phone', 'location'];
  const patch = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
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
    storeName, bio, isStudent, university, occupation, businessReg, location,
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
