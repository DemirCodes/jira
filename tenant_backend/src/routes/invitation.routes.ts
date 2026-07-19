import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { createInvitationSchema, acceptInvitationSchema } from '../schemas/invitation.schema';
import * as invitationController from '../controllers/invitation.controller';

const router = Router();

router.post('/', validate(createInvitationSchema), invitationController.create);
router.post('/accept', validate(acceptInvitationSchema), invitationController.accept);
router.post('/reject', validate(acceptInvitationSchema), invitationController.reject);
router.post('/cancel', invitationController.cancel);
router.get('/me', invitationController.listMyInvitations);
router.get('/org/:orgId', invitationController.listOrgInvitations);

export default router;


