import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me, changePassword, googleAuth } from '../controllers/authController.js';
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

export default router;
