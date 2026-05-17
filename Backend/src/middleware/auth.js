import { verifyAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { User } from '../models/User.js';

/**
 * `requireAuth` — verifies the JWT and loads the live user document.
 *
 * The user is fetched on every request because role/restriction state
 * can change while a token is still valid. A restricted account is
 * rejected here, so a single switch in the admin panel cuts off access
 * immediately.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');

    let payload;
    try { payload = verifyAccessToken(token); }
    catch { throw new HttpError(401, 'Invalid or expired token'); }

    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    if (user.restricted) throw new HttpError(403, 'Account is restricted', { reason: user.restrictReason });

    req.user = user;
    req.userId = user._id;
    next();
  } catch (e) {
    next(e);
  }
}

/** Allow only the listed roles past this middleware. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
  next();
};

export const requireAdmin = requireRole('admin');
