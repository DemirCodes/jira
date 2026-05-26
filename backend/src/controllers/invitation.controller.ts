import { Request, Response } from 'express';
import * as invitationService from '../services/invitation.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';

// CREATE
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { org_id, friendshipCode, entity_type, entity_id, role } = req.body;

        if (!org_id || !friendshipCode || !entity_type || !role) {
            res.status(400).json({ error: 'org_id, friendshipCode, entity_type, and role are required' });
            return;
        }

        // entity_type validasyonu
        const validTypes = ['organization', 'site', 'project', 'issue'];
        if (!validTypes.includes(entity_type)) {
            res.status(400).json({ error: 'Invalid entity_type. Must be: organization, site, project, issue' });
            return;
        }

        // Yetki kontrolü
        await authService.requireOrgAdminOrOwner(userId, org_id);

        const invitationId = await invitationService.createInvitation(
            org_id, friendshipCode, entity_type, role, entity_id
        );
        res.status(201).json({ invitation_id: invitationId });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to create invitation', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ACCEPT
export const accept = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.acceptInvitation(invitation_id);
        res.json({ message: 'Invitation accepted' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};

// REJECT
export const reject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.rejectInvitation(invitation_id);
        res.json({ message: 'Invitation rejected' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};

// CANCEL
export const cancel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.cancelInvitation(invitation_id);
        res.json({ message: 'Invitation cancelled' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};

// LIST (kullanıcının kendi davetleri)
export const listMyInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
        const invitations = await invitationService.getPendingInvitationsForUser();
        res.json(invitations);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Failed to retrieve invitations' });
    }
};

// LIST (organizasyonun bekleyen davetleri - admin/owner)
export const listOrgInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(orgId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
        }

        // Yetki: org admin/owner
        await authService.requireOrgAdminOrOwner(userId, orgId);

        const invitations = await invitationService.getPendingInvitationsForOrg(orgId);
        res.json(invitations);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Failed to retrieve invitations' });
    }
};