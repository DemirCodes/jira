import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { platformAuth } from '../middlewares/auth.middleware'; 

const router = Router();

// Public route
router.post('/login', authController.login);

// Protected route (Sadece giriş yapmış adminler çıkış yapabilir)
router.post('/logout', platformAuth, authController.logout);

export default router;