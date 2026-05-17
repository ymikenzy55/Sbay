import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  adminLogin, dashboard,
  listUsers, getUserDetail, verifyUser, restrictUser,
  listAdmins, createAdmin, removeAdmin,
  listAllProducts, moderateProduct,
  listAllOrders, releaseEscrow, refundEscrow,
  listAllPlans, upsertPlan, deletePlan,
  getSettings, updateSettings,
  listAuditLog, salesReport,
  listAllChats, getAdminChat, closeChat,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminAuthLimiter } from '../middleware/rateLimit.js';

const router = Router();

/* ---- Admin login (public, but obscured prefix + rate limited) ---- */
router.post(
  '/auth/login',
  adminAuthLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
  validate,
  adminLogin
);

/* ---- Everything below requires an admin JWT ---- */
router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);

/* Users */
router.get('/users', listUsers);
router.get('/users/:id', param('id').isMongoId(), validate, getUserDetail);
router.post(
  '/users/:id/verify',
  param('id').isMongoId(),
  body('decision').isIn(['approved', 'rejected']),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate, verifyUser
);
router.post(
  '/users/:id/restrict',
  param('id').isMongoId(),
  body('restricted').isBoolean(),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate, restrictUser
);

/* Admin management */
router.get('/admins', listAdmins);
router.post(
  '/admins',
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 10 }).withMessage('Admin passwords must be at least 10 characters'),
  validate, createAdmin
);
router.delete('/admins/:id', param('id').isMongoId(), validate, removeAdmin);

/* Products */
router.get('/products', listAllProducts);
router.post(
  '/products/:id/moderate',
  param('id').isMongoId(),
  body('action').isIn(['hide', 'unhide', 'remove']),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate, moderateProduct
);

/* Orders & escrow */
router.get('/orders', listAllOrders);
router.post(
  '/orders/:id/release-escrow',
  param('id').isMongoId(), validate, releaseEscrow
);
router.post(
  '/orders/:id/refund-escrow',
  param('id').isMongoId(),
  body('reason').isString().isLength({ min: 2, max: 500 }),
  validate, refundEscrow
);

/* Subscription plans */
router.get('/plans', listAllPlans);
router.post(
  '/plans',
  body('code').isString().trim().isLength({ min: 2, max: 30 }),
  body('name').isString().trim().isLength({ min: 2, max: 60 }),
  body('price').isFloat({ min: 0 }),
  body('feePct').isFloat({ min: 0, max: 100 }),
  body('features').optional().isArray(),
  validate, upsertPlan
);
router.delete('/plans/:id', param('id').isMongoId(), validate, deletePlan);

/* Settings */
router.get('/settings', getSettings);
router.patch(
  '/settings',
  body('platformName').optional().isString().isLength({ max: 60 }),
  body('defaultEscrowFeePct').optional().isFloat({ min: 0, max: 100 }),
  body('supportEmail').optional().isString(),
  body('announcement').optional().isString().isLength({ max: 500 }),
  body('maintenanceMode').optional().isBoolean(),
  validate, updateSettings
);

/* Reports & audit */
router.get('/audit', listAuditLog);
router.get(
  '/reports/sales',
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  validate, salesReport
);

/* Chats moderation */
router.get('/chats', listAllChats);
router.get('/chats/:id', param('id').isMongoId(), validate, getAdminChat);
router.post(
  '/chats/:id/close',
  param('id').isMongoId(),
  body('reason').optional().isString().isLength({ max: 200 }),
  validate, closeChat
);

export default router;
