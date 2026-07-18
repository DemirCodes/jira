import { Router } from 'express';
import { reportBug, getBugs, getBugDetails, deleteBug } from '../controllers/bug.controller';
import { tenantAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate'; 
import { createBugSchema } from '../schemas/bugValidator.schema';
import { bugLimiter } from '../middlewares/rateLimit'; 

const router = Router();

// Bütün rotalar auth korumasında
router.use(tenantAuth);

// GET isteklerine limiter koymuyoruz veya istersen apiLimiter koyabilirsin
router.get('/', getBugs);
router.get('/:id', getBugDetails);

// POST ve DELETE rotalarına BUG LIMITER kalkanını giydirdik!
router.post(
    '/', 
    bugLimiter, 
    validate({ source: 'body', schema: createBugSchema }), 
    reportBug
);

router.delete('/:id', bugLimiter, deleteBug);

export default router;