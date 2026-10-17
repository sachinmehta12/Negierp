import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireOwner } from '../middlewares/role.middleware';

const router = Router();

// Public endpoint for landing page
router.get('/public', FacultyController.publicList);

// Owner-only endpoints
router.use(authenticateJwt, requireOwner);

router.get('/', FacultyController.list);
router.post('/', FacultyController.create);
router.put('/:id', FacultyController.update);
router.patch('/:id/toggle-active', FacultyController.toggleActive);
router.delete('/:id', FacultyController.delete);

export default router;
