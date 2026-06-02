import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
    createProjectSchema,
    updateProjectSchema,
    updateProjectStatusSchema,
    inviteToProjectSchema
} from '../schemas/project.schema';
import * as projectController from '../controllers/project.controller';
import { inviteLimiter, memberManagementLimiter } from '../middlewares/rateLimit';

const router = Router();

// CRUD
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/site/:siteId', projectController.listBySite); // Query params ile filtreleme yapılabilir
router.get('/:id', projectController.getById);             // query param olarak ?site_id=... gerektirir
router.put('/:id', validate(updateProjectSchema), projectController.update);
router.patch('/:id/status', validate(updateProjectStatusSchema), projectController.updateStatus);
router.delete('/:id', projectController.remove);           // body içinde { site_id } gerektirir

// Invite & Members
router.post('/:id/invite', inviteLimiter, validate(inviteToProjectSchema), projectController.invite);
router.get('/:id/members', projectController.listMembers); // query param olarak ?site_id=... gerektirir

export default router;