import { Router } from 'express';
import { TimetableController } from '../controllers/timetable.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor timetable
router.get('/', requireMentor, TimetableController.list);
router.post('/', requireMentor, TimetableController.create);
router.delete('/:id', requireMentor, TimetableController.delete);

// Student portal timetable
router.get('/my', requireStudent, TimetableController.getStudentTimetable);

export default router;
