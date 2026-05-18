import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  updateMe, becomeSeller, getSellerById,
  addPaymentMethod, removePaymentMethod,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.patch(
  '/me',
  requireAuth,
  body('name').optional().isString().isLength({ min: 2, max: 80 }),
  body('avatar').optional().isString().isLength({ max: 1_000_000 }),
  body('phone').optional().isString().isLength({ max: 30 }),
  body('location').optional().isString().isLength({ max: 120 }),
  validate,
  updateMe
);

router.post(
  '/me/become-seller',
  requireAuth,
  body('storeName').isString().trim().isLength({ min: 2, max: 80 }),
  body('bio').optional().isString().isLength({ max: 2000 }),
  body('isStudent').optional().isBoolean(),
  body('university').optional().isString().isLength({ max: 120 }),
  body('occupation').optional().isString().isLength({ max: 120 }),
  body('businessReg').optional().isString().isLength({ max: 80 }),
  body('location').optional().isString().isLength({ max: 120 }),
  // Inline base64 data-URL student ID. Validation cap is generous; the
  // controller enforces the byte budget more strictly.
  body('idCardUrl').optional().isString().isLength({ max: 6_000_000 }),
  validate,
  becomeSeller
);

router.post(
  '/me/payment-methods',
  requireAuth,
  body('brand').isString().isLength({ max: 30 }),
  body('last4').isString().isLength({ min: 2, max: 6 }),
  body('holder').optional().isString().isLength({ max: 80 }),
  body('expiry').optional().isString().isLength({ max: 7 }),
  body('method').optional().isIn(['card', 'momo']),
  validate,
  addPaymentMethod
);

router.delete(
  '/me/payment-methods/:cardId',
  requireAuth,
  param('cardId').isMongoId(),
  validate,
  removePaymentMethod
);

router.get(
  '/sellers/:id',
  param('id').isMongoId(),
  validate,
  getSellerById
);

export default router;
