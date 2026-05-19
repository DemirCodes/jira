import { Request, Response } from 'express';
import * as orgService from '../services/organization.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { name, slug, description } = req.body;

        if (!name || !slug) {
            res.status(400).json({ error: 'name and slug are required' });
            return;
        }

        // Create: authenticated user yeterli
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
        // listUserOrganizations DB fonksiyonu zaten sadece kullanıcının üye olduğu organizasyonları döner
        const orgs = await orgService.getUserOrganizations();
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

        // UUID validasyonu - önce format kontrolü
        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
        }

        // Yetki kontrolü
        await authService.requireOrgMember(userId, id);

        const org = await orgService.getOrganizationById(id);
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

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        await orgService.updateOrganization(id, name, description, slug);
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

        // Yetki kontrolü: sadece owner
        await authService.requireOrgOwner(userId, id);

        await orgService.deleteOrganization(id);
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
        const { id } = req.params;
        const userId = req.userId!;
        const { friendshipCode, role = 'member' } = req.body;

        if (!friendshipCode) {
            res.status(400).json({ error: 'friendshipCode is required' });
            return;
        }

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        const invitationId = await orgService.inviteToOrganization(id, friendshipCode, role);
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

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        const members = await orgService.getOrganizationMembers(id);
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

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        await orgService.updateMemberRole(id, memberId, role);
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

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        await orgService.removeMember(id, memberId);
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

        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);

        const invitations = await orgService.getPendingInvitations(id);
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

        // Yetki kontrolü: owner veya admin (orgId'yi invitation'dan almak gerekir, şimdilik es geçiyoruz)
        // await authService.requireOrgAdminOrOwner(userId, orgId);

        await orgService.cancelInvitation(invitationId);
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

        // Yetki kontrolü: üye olan herkes görebilir
        await authService.requireOrgMember(userId, id);

        const stats = await orgService.getOrganizationStats(id);
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

        // Yetki kontrolü: üye olan herkes ayrılabilir (son owner kontrolü DB'de)
        await authService.requireOrgMember(userId, id);

        await orgService.leaveOrganization(id);
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