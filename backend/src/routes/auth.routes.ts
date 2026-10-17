import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register-student', AuthController.registerStudent);
router.post('/register-mentor', AuthController.registerMentor);
router.post('/change-password', authenticateJwt, AuthController.changePassword);
router.get('/me', authenticateJwt, AuthController.getMe);

export default router;
