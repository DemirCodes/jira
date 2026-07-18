import { Router } from 'express';
import { getTenantBugs, getBugById, updateBug, deleteBug } from '../controllers/bug.controller';
import { platformAuth } from '../middlewares/auth.middleware';

const router = Router();

// Sadece giriş yapmış kullanıcılar buraya erişebilir
// Rol kontrolünü controller'da yapıyoruz
router.get('/', platformAuth, getTenantBugs);
router.get('/:id', platformAuth, getBugById);
router.put('/:id', platformAuth, updateBug);
router.delete('/:id', platformAuth, deleteBug);

export default router;