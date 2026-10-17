import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor management
router.get('/', requireMentor, ExamController.list);
router.post('/', requireMentor, ExamController.create);
router.put('/:id', requireMentor, ExamController.update);
router.delete('/:id', requireMentor, ExamController.delete);
router.get('/:id/marksheet', requireMentor, ExamController.getMarksheet);
router.post('/:id/marks', requireMentor, ExamController.recordMarks);

// Student portal
router.get('/my/results', requireStudent, ExamController.getStudentMarks);

export default router;
