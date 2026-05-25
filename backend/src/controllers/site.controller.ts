import { Request, Response } from 'express';
import * as siteService from '../services/site.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';

// CREATE
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { name, slug, org_id } = req.body;

        if (!name || !slug || !org_id) {
            res.status(400).json({ error: 'name, slug, and org_id are required' });
            return;
        }

        // Yetki: org_owner veya org_admin
        await authService.requireOrgAdminOrOwner(userId, org_id);

        const siteId = await siteService.createSite(name, slug, org_id);
        res.status(201).json({ site_id: siteId });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to create site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - List by Org
export const listByOrg = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(orgId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID');
        }

        await authService.requireOrgMember(userId, orgId);

        const sites = await siteService.getSitesByOrg(orgId);
        res.json(sites);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list sites', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get by ID
export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const site = await siteService.getSiteById(id);
        if (!site) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }
        res.json(site);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to get site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// UPDATE
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { name, slug, is_private } = req.body;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSite(id, name, slug, is_private);
        res.json({ message: 'Site updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// UPDATE STATUS
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { status, org_id } = req.body;

        if (!status || !['active', 'archived', 'suspended'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Allowed: active, archived, suspended' });
            return;
        }

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteStatus(id, status, org_id);
        res.json({ message: 'Site status updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update site status', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE
export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id } = req.body;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.deleteSite(id, org_id);
        res.json({ message: 'Site deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// INVITE
export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id, friendshipCode, role = 'contrubitor' } = req.body;

        if (!friendshipCode || !org_id) {
            res.status(400).json({ error: 'friendshipCode and org_id are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id) || !isValidUUID(friendshipCode)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
        }

        await authService.requireSiteInvitePermission(userId, id);

        const invitationId = await siteService.inviteToSite(friendshipCode, org_id, id, role);
        res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to invite to site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// MEMBERS - List
export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const members = await siteService.getSiteMembers(id);
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

// MEMBERS - Update Role
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;
        const { role } = req.body;

        if (!role || !['admin', 'contrubitor', 'viewer'].includes(role)) {
            res.status(400).json({ error: 'Invalid role. Allowed: admin, contrubitor, viewer' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(memberId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteMemberRole(id, memberId, role);
        res.json({ message: 'Member role updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update member role', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// MEMBERS - Remove
export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id) || !isValidUUID(memberId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.removeSiteMember(id, memberId);
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

// STATS
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const stats = await siteService.getSiteStats(id);
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