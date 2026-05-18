import { User } from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAdmins } from '../socket.js';

/**
 * Public sign-up. Always creates a `buyer`. Becoming a seller happens
 * later through `/api/users/me/become-seller`. Admins are NEVER created
 * via this endpoint — only via the seed script or by another admin.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, location } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    location: location?.trim(),
    role: 'buyer',
  });

  const token = signAccessToken(user);

  emitToAdmins('user:new', {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    message: `${user.name} just joined sBay.`,
  });

  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const ok = await user.checkPassword(password);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  if (user.restricted) throw new HttpError(403, 'Account is restricted', { reason: user.restrictReason });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAccessToken(user);
  res.json({ token, user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  const ok = await user.checkPassword(currentPassword);
  if (!ok) throw new HttpError(400, 'Current password is incorrect');
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  res.json({ ok: true });
});
