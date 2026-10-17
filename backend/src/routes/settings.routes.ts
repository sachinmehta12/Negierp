import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

// Publicly readable for institute branding
router.get('/', SettingsController.getSettings);

// Mentor or Owner can update settings
router.use(authenticateJwt, requireMentor);
router.put('/', SettingsController.updateSettings);

export default router;
