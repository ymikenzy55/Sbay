import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Sign an access token. We deliberately keep claims minimal — just the
 * user id and role — and look up everything else from the DB on each
 * request. That way "admin removed someone's seller role" takes effect
 * on the very next request, instead of having to wait for the JWT to
 * expire.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
