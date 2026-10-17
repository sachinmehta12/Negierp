import { Router } from 'express';
import { HomeworkController } from '../controllers/homework.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor management
router.get('/', requireMentor, HomeworkController.list);
router.post('/', requireMentor, HomeworkController.create);
router.delete('/:id', requireMentor, HomeworkController.delete);

// Student portal
router.get('/my', requireStudent, HomeworkController.getStudentHomework);
router.post('/:id/complete', requireStudent, HomeworkController.toggleStudentStatus);

export default router;
