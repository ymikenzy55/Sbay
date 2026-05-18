import { Router } from 'express';
import { body } from 'express-validator';
import { initializePayment, verifyPayment, paystackWebhook } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/initialize',
  requireAuth,
  authLimiter,
  body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
  body('items.*.productId').isMongoId().withMessage('Invalid product id'),
  body('items.*.qty').isInt({ min: 1, max: 1000 }).withMessage('Quantity must be a positive whole number'),
  body('deliveryLocation').isString().trim().notEmpty().withMessage('Delivery location is required').isLength({ max: 200 }),
  validate,
  initializePayment
);

router.post(
  '/verify',
  requireAuth,
  body('reference').isString().notEmpty().withMessage('Reference is required'),
  validate,
  verifyPayment
);

router.post('/webhook', paystackWebhook);

export default router;
