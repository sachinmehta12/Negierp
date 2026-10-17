import { Router } from 'express';
import { StreamController } from '../controllers/stream.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireMentor } from '../middlewares/role.middleware';

const router = Router();

// Publicly accessible for registration dropdowns, authenticated for modifications
router.get('/', StreamController.list);

router.use(authenticateJwt);
router.post('/', requireMentor, StreamController.create);
router.put('/:id', requireMentor, StreamController.update);
router.delete('/:id', requireMentor, StreamController.delete);

export default router;
