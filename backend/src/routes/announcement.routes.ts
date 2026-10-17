import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', AnnouncementController.list);
router.post('/', requireMentor, AnnouncementController.create);
router.delete('/:id', requireMentor, AnnouncementController.delete);

export default router;
