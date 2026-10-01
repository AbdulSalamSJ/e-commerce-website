import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Authenticated route
router.get('/me', authenticateJWT, getMe);

export default router;