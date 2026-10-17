import { Router } from 'express';
import { ChangeRequestController } from '../controllers/change-request.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor routes
router.get('/', requireMentor, ChangeRequestController.list);
router.post('/:id/action', requireMentor, ChangeRequestController.handleAction);

// Student portal routes
router.get('/my', requireStudent, ChangeRequestController.getStudentRequests);
router.post('/', requireStudent, ChangeRequestController.studentSubmit);

export default router;
