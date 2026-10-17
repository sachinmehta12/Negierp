import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt, requireMentor);

router.get('/dashboard', AnalyticsController.getDashboard);
router.get('/academic', AnalyticsController.getAcademicAnalytics);

export default router;
