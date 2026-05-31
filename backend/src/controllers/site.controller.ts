/**
 * SITE CONTROLLER
 * 
 * Tüm yetkilendirme authorization.service.ts ile yapılır.
 * Controller sadece request/response işlemlerinden sorumludur.
 * 
 * GÜVENLİK: Tüm yazma işlemlerinde org_id validasyonu yapılır.
 */

import { Request, Response } from 'express';
import * as siteService from '../services/site.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';

// ==================== CREATE ====================
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

// ==================== READ ====================
export const listByOrg = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(orgId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID');
        }

        // Yetki: org member (owner, admin, member, viewer)
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

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        // Yetki: site_member veya org_owner/admin (hiyerarşik)
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

// ==================== UPDATE ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id, name, slug, is_private } = req.body;

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSite(id, org_id, name, slug, is_private);
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

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id, status } = req.body;

        if (!org_id || !status) {
            res.status(400).json({ error: 'org_id and status are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteStatus(id, org_id, status);
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

// ==================== DELETE ====================
export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id } = req.body;

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner veya site_admin
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

// ==================== INVITE ====================
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
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner, org_admin veya site_admin
        await authService.requireSiteInvitePermission(userId, id);

        // Davet sistemini kullan
        const invitationService = await import('../services/invitation.service');
        const invitationId = await invitationService.createInvitation(
            org_id, friendshipCode, 'site', role, id
        );

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

// ==================== MEMBERS ====================
export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        // Yetki: site member (viewer dahil)
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

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;
        const { org_id, role } = req.body;

        if (!org_id || !role) {
            res.status(400).json({ error: 'org_id and role are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(memberId) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteMemberRole(id, org_id, memberId, role);
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

export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId!;
        const { org_id } = req.body;

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(memberId) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.removeSiteMember(id, org_id, memberId);
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

// ==================== STATS ====================
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        // Yetki: site member
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