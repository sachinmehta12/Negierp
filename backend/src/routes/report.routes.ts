import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt, requireMentor);

router.get('/students.csv', ReportController.exportStudents);
router.get('/fees.csv', ReportController.exportFees);
router.get('/marks.csv', ReportController.exportMarks);
router.get('/attendance.csv', ReportController.exportAttendance);

export default router;
