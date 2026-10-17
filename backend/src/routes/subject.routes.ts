import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

// Publicly readable for stream/class selections
router.get('/', SubjectController.list);

router.use(authenticateJwt);

// Mentor's assigned subjects
router.get('/my', requireMentor, SubjectController.getMySubjects);
router.post('/my', requireMentor, SubjectController.updateMySubjects);

// CRUD
router.post('/', requireMentor, SubjectController.create);
router.put('/:id', requireMentor, SubjectController.update);
router.delete('/:id', requireMentor, SubjectController.delete);

export default router;
