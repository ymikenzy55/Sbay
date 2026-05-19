import { Router } from 'express';
import { body } from 'express-validator';
import { submitSupport } from '../controllers/supportController.js';
import { validate } from '../middleware/validate.js';
import { supportSubmitLimiter } from '../middleware/rateLimit.js';
import { optionalAuth } from '../middleware/auth.js';

/**
 * Public-facing support endpoint. Registered users get auto-stitched
 * onto the ticket via `optionalAuth`; guests provide name + email.
 */
const router = Router();

router.post(
  '/tickets',
  supportSubmitLimiter,
  optionalAuth,
  body('name').isString().trim().isLength({ min: 1, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').isString().trim().isLength({ min: 7, max: 30 }).withMessage('Contact number is required'),
  body('subject').optional().isString().isLength({ max: 160 }),
  body('message').isString().trim().isLength({ min: 1, max: 4000 }),
  validate,
  submitSupport
);

export default router;
