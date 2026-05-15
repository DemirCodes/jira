import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    inviteToOrganizationSchema,
    updateMemberRoleSchema
} from '../schemas/organization.schema';
import * as orgController from '../controllers/organization.controller';

const router = Router();

router.post('/', validate(createOrganizationSchema), orgController.create);
router.get('/', orgController.list);
router.get('/:id', orgController.getById);
router.patch('/:id', validate(updateOrganizationSchema), orgController.update);
router.delete('/:id', orgController.remove);

// Members
router.get('/:id/members', orgController.listMembers);
router.patch('/:id/members/:memberId', validate(updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', orgController.removeMember);

// Invitations
router.post('/:id/invite', validate(inviteToOrganizationSchema), orgController.invite);
router.get('/:id/invitations', orgController.listInvitations);
router.delete('/invitations/:invitationId', orgController.cancelInvitation);

// Stats & Leave
router.get('/:id/stats', orgController.getStats);
router.post('/:id/leave', orgController.leave);

export default router;