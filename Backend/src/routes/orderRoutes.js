import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  checkout, myOrders, mySales, getOrder,
  updateStatusBySeller, buyerConfirmReceipt, cancelOrder,
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/checkout',
  requireAuth,
  body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
  body('items.*.productId').isMongoId().withMessage('Invalid product id'),
  body('items.*.qty')
    .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be a positive whole number'),
  body('payment.brand').optional().isString().isLength({ max: 30 }),
  body('payment.last4').optional().isString().isLength({ max: 6 }),
  validate,
  checkout
);

router.get('/mine', requireAuth, myOrders);
router.get('/sales', requireAuth, requireRole('seller'), mySales);

router.get('/:id', requireAuth, param('id').isMongoId(), validate, getOrder);

router.patch(
  '/:id/status',
  requireAuth, requireRole('seller'),
  param('id').isMongoId(),
  body('status').isIn(['processing', 'shipped', 'delivered']),
  validate,
  updateStatusBySeller
);

router.post(
  '/:id/confirm-receipt',
  requireAuth,
  param('id').isMongoId(), validate,
  buyerConfirmReceipt
);

router.post(
  '/:id/cancel',
  requireAuth,
  param('id').isMongoId(),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate,
  cancelOrder
);

export default router;
