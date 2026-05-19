import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, login, me, changePassword, googleAuth,
  requestPasswordReset, resetPasswordWithToken,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 chars'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString().trim().isLength({ max: 30 }),
  body('location').optional().isString().isLength({ max: 120 }),
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password required'),
  validate,
  login
);

router.get('/me', requireAuth, me);

router.post('/oauth/google', authLimiter, googleAuth);

router.post(
  '/change-password',
  requireAuth,
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8 }),
  validate,
  changePassword
);

router.post(
  '/forgot-password',
  authLimiter,
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  validate,
  requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('token').isString().isLength({ min: 32 }).withMessage('Invalid reset token'),
  body('newPassword').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  resetPasswordWithToken
);

export default router;
