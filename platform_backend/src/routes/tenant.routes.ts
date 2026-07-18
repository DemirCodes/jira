import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller';
import { platformAuth, requirePlatformRole } from '../middlewares/auth.middleware'; // veya auth.ts

const router = Router();

// Sadece oturum açmış ve rolü super_admin olanlar yeni şirket kurabilir
router.post(
    '/provision', 
    platformAuth, 
    requirePlatformRole(['super_admin']), 
    tenantController.createTenant
);
export default router;

