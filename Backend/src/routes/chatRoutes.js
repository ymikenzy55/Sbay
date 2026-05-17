import { Router } from 'express';
import { body, param } from 'express-validator';
import { listChats, getChat, sendMessage, startChat } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', listChats);

router.post(
  '/start',
  body('sellerId').isMongoId(),
  validate,
  startChat
);

router.get('/:id', param('id').isMongoId(), validate, getChat);

router.post(
  '/:id/messages',
  param('id').isMongoId(),
  body('text').isString().trim().isLength({ min: 1, max: 4000 }),
  validate,
  sendMessage
);

export default router;
