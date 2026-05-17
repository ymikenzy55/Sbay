import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * General-purpose limiter applied to the whole API. Tuned to be
 * generous enough for SPA usage but to throttle obvious abuse.
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

/**
 * Tighter limiter for auth endpoints (register, login, password). The
 * intent is to make credential stuffing painful without blocking real
 * users on a flaky connection.
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again shortly.' },
});

/** Even tighter limiter for the obscured admin login. */
export const adminAuthLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many admin login attempts.' },
});
