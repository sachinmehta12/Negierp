import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor routes
router.get('/register', requireMentor, AttendanceController.getRegister);
router.post('/record', requireMentor, AttendanceController.recordAttendance);

// Student portal route
router.get('/my', requireStudent, AttendanceController.getStudentAttendance);

export default router;
