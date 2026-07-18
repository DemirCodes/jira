/**
 * SITE CONTROLLER
 */

import { Request, Response } from 'express';
import * as siteService from '../services/site.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';
import * as siteAssetService from '../services/siteAsset.service';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.tenantUser!.id!;
        // Zod'dan geleni karşılamak için hem org_id hem orgId destekli
        const org_id = req.body.org_id || req.body.orgId;
        const { name, slug } = req.body;

        if (!name || !slug || !org_id) {
            res.status(400).json({ error: 'name, slug, and org_id are required' });
            return;
        }

        await authService.requireOrgAdminOrOwner(userId, org_id);

        const siteId = await siteService.createSite(name, slug, org_id, userId);
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
        const userId = req.tenantUser!.id!;

        if (!isValidUUID(orgId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID');
        }

        await authService.requireOrgMember(userId, orgId);

        const sites = await siteService.getSitesByOrg(orgId, userId);
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
        const userId = req.tenantUser!.id!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const site = await siteService.getSiteById(id, userId);
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
        const userId = req.tenantUser!.id!;
        const org_id = req.body.org_id || req.body.orgId;
        const { name, slug, is_private } = req.body;

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSite(id, org_id, name, slug, is_private, userId);
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
        const userId = req.tenantUser!.id!;
        const { org_id, status } = req.body;

        if (!org_id || !status) {
            res.status(400).json({ error: 'org_id and status are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteStatus(id, status, org_id, userId);
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
        const userId = req.tenantUser!.id!;
        
        // FIX 422: DELETE isteklerinde body yerine query üzerinden veri al
        const org_id = req.body.org_id || req.query.org_id;

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id as string)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.deleteSite(id, org_id as string, userId);
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
        const userId = req.tenantUser!.id!;
        const { org_id, friendshipCode, role = 'contributor' } = req.body;

        if (!friendshipCode || !org_id) {
            res.status(400).json({ error: 'friendshipCode and org_id are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(org_id) || !isValidUUID(friendshipCode)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteInvitePermission(userId, id);

        const invitationId = await siteService.inviteToSite(friendshipCode, org_id, id, role, userId);

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
        const userId = req.tenantUser!.id!;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const members = await siteService.getSiteMembers(id, userId, limit, offset);
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
        const userId = req.tenantUser!.id!;
        const { org_id, role } = req.body;

        if (!org_id || !role) {
            res.status(400).json({ error: 'org_id and role are required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(memberId) || !isValidUUID(org_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.updateSiteMemberRole(id, org_id, memberId, role, userId);
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
        const userId = req.tenantUser!.id!;
        const org_id = req.body.org_id || req.query.org_id; // FIX FOR 422 ON DELETE

        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }

        if (!isValidUUID(id) || !isValidUUID(memberId) || !isValidUUID(org_id as string)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }

        await authService.requireSiteAdminOrOrgOwner(userId, id);

        await siteService.removeSiteMember(id, org_id as string, memberId, userId);
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
        const userId = req.tenantUser!.id!;

        if (!isValidUUID(id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }

        await authService.requireSiteMember(userId, id);

        const stats = await siteService.getSiteStats(id, userId);
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


// ==================== 1. CREATE (SITE ASSET EKLEME) ====================
export const uploadSiteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // site_id
        const userId = req.tenantUser!.id!; // uploaded_by
        const { asset_type, metadata } = req.body; 

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid Site ID format');
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const dummy_storage_key = `sites/${id}/assets/${Date.now()}_${req.file.originalname}`;

        const assetId = await siteAssetService.createSiteAsset({
            site_id: id,
            uploaded_by: userId,
            asset_type: asset_type || 'site_logo',
            file_name: req.file.originalname,
            mime_type: req.file.mimetype,
            byte_size: req.file.size,
            storage_key: dummy_storage_key,
            checksum: (req.file as any).checksum, // Bizim paralel tarayıcının hesapladığı SHA-256
            metadata: metadata ? JSON.parse(metadata) : null
        });

        res.status(201).json({ 
            message: 'Site asset scanned, uploaded and saved successfully',
            site_asset_id: assetId
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to handle site asset upload', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const listSiteAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // site_id
        const userId = req.tenantUser!.id!;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        const assets = await siteAssetService.listSiteAssets(id, userId, limit, offset);
        res.json(assets);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeSiteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, assetId } = req.params; // id = site_id, assetId = site_asset_id
        const userId = req.tenantUser!.id!;

        if (!isValidUUID(id) || !isValidUUID(assetId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid format for Site ID or Asset ID');
        }

        await siteAssetService.deleteSiteAsset(assetId, id, userId);

        res.status(200).json({ message: 'Site asset soft deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete site asset', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};