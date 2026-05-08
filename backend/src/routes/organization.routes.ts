import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as c from '../controllers/organization.controller';

const router = Router();

router.use(authMiddleware);

// Core CRUD
router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

// Invitations
router.post('/:id/invite', c.invite);
router.get('/:id/invitations', c.listInvitations);
router.delete('/:id/invitations/:invitationId', c.cancelInvitation);

// Members
router.get('/:id/members', c.listMembers);
router.put('/:id/members/:memberId/role', c.updateMemberRole);
router.delete('/:id/members/:memberId', c.removeMember);
router.post('/:id/leave', c.leave);

// Stats
router.get('/:id/stats', c.getStats);

export default router;