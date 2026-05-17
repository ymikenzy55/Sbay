import { Router } from 'express';
import { listPlans, publicSettings } from '../controllers/publicController.js';

const router = Router();

router.get('/plans', listPlans);
router.get('/settings', publicSettings);

export default router;
