import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticateJwt);

// Mentor management routes
router.get('/', requireMentor, FeeController.list);
router.post('/record/:studentId', requireMentor, FeeController.recordPayment);
router.post('/verify/:id', requireMentor, FeeController.verifyPayment);
router.post('/batch-verify', requireMentor, FeeController.batchVerify);
router.post('/reject/:id', requireMentor, FeeController.rejectPayment);
router.put('/adjust/:studentId', requireMentor, FeeController.adjustStructure);

// Student portal routes
router.get('/my', requireStudent, FeeController.getStudentFees);
router.post('/my/submit', requireStudent, FeeController.studentSubmitPayment);

// Receipt view (both mentor and student)
router.get('/receipt/:id', FeeController.getReceipt);

export default router;
