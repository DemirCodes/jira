/**
 * ORGANIZATION CONTROLLER
 */

import { Request, Response } from 'express';
import * as orgService from '../services/organization.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';
import * as invitationService from '../services/invitation.service';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { name, slug, description } = req.body;

        if (!name || !slug) {
            res.status(400).json({ error: 'name and slug are required' });
            return;
        }

        // userId eklendi
        const orgId = await orgService.createOrganization(userId, name, slug, description);
        res.status(201).json({ org_id: orgId });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to create organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== READ ====================
export const list = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        // userId eklendi
        const orgs = await orgService.getUserOrganizations(userId);
        res.json(orgs);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list organizations', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
        }

        await authService.requireOrgMember(userId, id);

        // userId eklendi
        const org = await orgService.getOrganizationById(id, userId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        res.json(org);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to get organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== UPDATE ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { name, description, slug } = req.body;

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi (Sıralama: orgId, userId, name, description, slug)
        await orgService.updateOrganization(id, userId, name, description, slug);
        res.json({ message: 'Organization updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== DELETE ====================
export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        await authService.requireOrgOwner(userId, id);

        // userId eklendi
        await orgService.deleteOrganization(id, userId);
        res.json({ message: 'Organization deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== INVITE ====================
export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { friendshipCode, role = 'member' } = req.body;

        if (!friendshipCode) {
            res.status(400).json({ error: 'friendshipCode is required' });
            return;
        }

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi (NOT: invitationService içindeki createInvitation fonksiyonunun da 
        // userId parametresini kabul edecek ve RLS kuracak şekilde güncellendiğinden emin ol)
        const invitationId = await invitationService.createInvitation(
            id,                  
            friendshipCode,      
            'organization',      
            role,                
            undefined,
            userId               
        );

        res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to invite to organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== MEMBERS ====================
export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi
        const members = await orgService.getOrganizationMembers(id, userId);
        res.json(members);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list members', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;
        const { role } = req.body;

        const validRoles = ['admin', 'member', 'viewer'];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({ error: 'Invalid role. Allowed: admin, member, viewer' });
            return;
        }

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi
        await orgService.updateMemberRole(id, memberId, role, userId);
        res.json({ message: 'Role updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update member role', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi
        await orgService.removeMember(id, memberId, userId);
        res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to remove member', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== INVITATIONS ====================
export const listInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        await authService.requireOrgAdminOrOwner(userId, id);

        // userId eklendi
        const invitations = await orgService.getPendingInvitations(id, userId);
        res.json(invitations);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list invitations', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitationId } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(invitationId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid invitation ID');
        }

        // userId eklendi
        const orgId = await orgService.getInvitationOrgId(invitationId, userId);
        if (!orgId) {
            await orgService.cancelInvitation(invitationId, userId);
            res.json({ message: 'Invitation cancelled' });
            return;
        }

        await authService.requireOrgAdminOrOwner(userId, orgId);

        // userId eklendi
        await orgService.cancelInvitation(invitationId, userId);
        res.json({ message: 'Invitation cancelled' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to cancel invitation', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== STATS ====================
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        await authService.requireOrgMember(userId, id);

        // userId eklendi
        const stats = await orgService.getOrganizationStats(id, userId);
        res.json(stats);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to get stats', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== LEAVE ====================
export const leave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        await authService.requireOrgMember(userId, id);

        // userId eklendi
        await orgService.leaveOrganization(id, userId);
        res.json({ message: 'Successfully left organization' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to leave organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};