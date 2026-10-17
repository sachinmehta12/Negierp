import { Router } from 'express';
import { TestimonialController } from '../controllers/testimonial.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireOwner } from '../middlewares/role.middleware';

const router = Router();

// Public endpoint for landing page
router.get('/public', TestimonialController.publicList);

// Owner-only endpoints
router.use(authenticateJwt, requireOwner);

router.get('/', TestimonialController.list);
router.post('/', TestimonialController.create);
router.put('/:id', TestimonialController.update);
router.delete('/:id', TestimonialController.delete);

export default router;
