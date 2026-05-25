import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
    createSiteSchema,
    updateSiteSchema,
    inviteToSiteSchema,
    updateSiteMemberRoleSchema
} from '../schemas/site.schema';
import * as siteController from '../controllers/site.controller';
import { inviteLimiter, memberManagementLimiter } from '../middlewares/rateLimit';
const router = Router();

// CRUD
router.post('/', validate(createSiteSchema), siteController.create);
router.get('/org/:orgId', siteController.listByOrg);
router.get('/:id', siteController.getById);
router.put('/:id', validate(updateSiteSchema), siteController.update);
router.patch('/:id/status', siteController.updateStatus);
router.delete('/:id', siteController.remove);

// Invite
router.post('/:id/invite', inviteLimiter, validate(inviteToSiteSchema), siteController.invite);
router.put('/:id/members/:memberId/role', memberManagementLimiter, validate(updateSiteMemberRoleSchema), siteController.updateMemberRole);
router.delete('/:id/members/:memberId', memberManagementLimiter, siteController.removeMember);

// Members
router.get('/:id/members', siteController.listMembers);
router.put('/:id/members/:memberId/role', validate(updateSiteMemberRoleSchema), siteController.updateMemberRole);
router.delete('/:id/members/:memberId', siteController.removeMember);

// Stats
router.get('/:id/stats', siteController.getStats);

export default router;