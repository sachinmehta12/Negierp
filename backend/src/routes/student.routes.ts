import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor, requireStudent } from '../middlewares/role.middleware';

const router = Router();

// Public Admission Enquiry endpoint
router.post('/enquiry', StudentController.submitEnquiry);

router.use(authenticateJwt);

// Mentor & Owner routes
router.get('/', requireMentor, StudentController.list);
router.post('/', requireMentor, StudentController.create);
router.get('/:id', requireMentor, StudentController.getById);
router.put('/:id', requireMentor, StudentController.update);
router.patch('/:id/toggle-active', requireMentor, StudentController.toggleActive);
router.post('/:id/assign-subjects', requireMentor, StudentController.assignSubjects);
router.delete('/:id', requireMentor, StudentController.delete);

// Student self-profile routes
router.get('/self/profile', requireStudent, StudentController.getSelfProfile);
router.put('/self/profile', requireStudent, StudentController.updateSelfProfile);
router.post('/self/stream', requireStudent, StudentController.selectStream);
router.post('/self/subjects', requireStudent, StudentController.selectSubjects);

export default router;
