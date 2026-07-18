/**
 * ISSUE CONTROLLER
 * Zero-Trust & RBAC (Role-Based Access Control) mimarisine göre yapılandırıldı.
 * Yetki kontrolleri IssueAccessPolicy üzerinden merkezi olarak yapılır.
 */

import { Request, Response } from 'express';
import * as issueService from '../services/issue.service';
import { IssueAccessPolicy } from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';
import * as issueAssetService from '../services/issueAssets.service';


// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.tenantUser!.id!;
        const { project_id, title, description, is_private } = req.body;

        if (!project_id || !title) {
            res.status(400).json({ error: 'project_id and title are required' });
            return;
        }

        if (!isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid project_id format');

        // YETKİ KONTROLÜ: Sadece Project Admin veya Contributor oluşturabilir
        await IssueAccessPolicy.validateCreation(userId, project_id);

        const issueId = await issueService.createIssue(
            project_id, 
            title, 
            userId, 
            description, 
            is_private
        );
        
        res.status(201).json({ issue_id: issueId });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to create issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== READ (LIST & GET) ====================
export const list = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.tenantUser!.id!;
        const project_id = req.query.project_id as string;
        const status = req.query.status as string;
        const priority = req.query.priority as string;
        const assignee_id = req.query.assignee_id as string;
        const reporter_id = req.query.reporter_id as string;
        const search = req.query.search as string;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

        if (project_id && !isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid project_id format');

        // YETKİ KONTROLÜ: Proje bazlı arama yapılıyorsa yetkiye bak
        if (project_id) {
            await IssueAccessPolicy.validateRead(userId, project_id);
        }

        const issues = await issueService.listIssues(
            userId,
            project_id,
            status,
            priority,
            assignee_id,
            reporter_id,
            search,
            limit,
            offset
        );
        
        res.json(issues);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list issues', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issueId
        const userId = req.tenantUser!.id!;
        const project_id = req.query.project_id as string;

        if (project_id && !isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid project_id format');
        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid issue_id format');

        // YETKİ KONTROLÜ: Proje üyesi görevi görüntüleyebilir
        if (project_id) {
            await IssueAccessPolicy.validateRead(userId, project_id);
        }

        const issue = await issueService.getIssueById(id, userId, project_id);
        res.json(issue);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to get issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== WRITE (UPDATE, INVITE, DELETE, RESTORE) ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issueId
        const userId = req.tenantUser!.id!;
        const { project_id, title, description, status, priority, assignee_id, is_private } = req.body;

        if (!project_id) {
            res.status(400).json({ error: 'project_id is required in body for authorization' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Admin, Assignee, Reporter, Issue Contributor değiştirebilir
        await IssueAccessPolicy.validateUpdate(userId, project_id, id);

        await issueService.updateIssue(id, userId, project_id, title, description, status, priority, assignee_id, is_private);
        res.json({ message: 'Issue updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issueId
        const userId = req.tenantUser!.id!;
        const { friendship_code, org_id, site_id, project_id, role } = req.body;

        if (!friendship_code || !org_id || !site_id || !project_id || !role) {
            res.status(400).json({ error: 'friendship_code, org_id, site_id, project_id, and role are required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(project_id) || !isValidUUID(org_id) || !isValidUUID(site_id)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
        }

        // YETKİ KONTROLÜ: Görevi atama yetkisi olanlar (Admin, Contributor vb.)
        await IssueAccessPolicy.validateUpdate(userId, project_id, id);

        await issueService.inviteToIssue(friendship_code, org_id, site_id, project_id, id, role, userId);
        res.status(201).json({ message: `User invited to issue as ${role} successfully` });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to invite user to issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issueId
        const userId = req.tenantUser!.id!;
        
        const project_id = req.query.project_id as string || req.body.project_id;

        if (!project_id) {
            res.status(400).json({ error: 'project_id is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin silebilir
        await IssueAccessPolicy.validateManagement(userId, project_id);

        await issueService.deleteIssue(id, userId, project_id);
        res.json({ message: 'Issue soft deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const restore = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issueId
        const userId = req.tenantUser!.id!;
        const project_id = req.query.project_id as string || req.body.project_id;

        if (!project_id) {
            res.status(400).json({ error: 'project_id is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(project_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin restore edebilir
        await IssueAccessPolicy.validateManagement(userId, project_id);

        await issueService.restoreIssue(id, userId, project_id);
        res.json({ message: 'Issue restored successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to restore issue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};


// ==================== ISSUE ASSET ENDPOINTS ====================

export const uploadIssueAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issue_id
        const userId = req.tenantUser!.id!;
        const { asset_type, metadata } = req.body;

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid Issue ID format');
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const dummy_storage_key = `issues/${id}/assets/${Date.now()}_${req.file.originalname}`;

        const assetId = await issueAssetService.createIssueAsset({
            issue_id: id,
            uploaded_by: userId,
            asset_type: asset_type || 'file',
            file_name: req.file.originalname,
            mime_type: req.file.mimetype,
            byte_size: req.file.size,
            storage_key: dummy_storage_key,
            checksum: (req.file as any).checksum,
            metadata: metadata ? JSON.parse(metadata) : null
        });

        res.status(201).json({
            message: 'Issue asset scanned, uploaded and saved successfully',
            issue_asset_id: assetId
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to handle issue asset upload', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const listIssueAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // issue_id
        const userId = req.tenantUser!.id!;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        const assets = await issueAssetService.listIssueAssets(id, userId, limit, offset);
        res.json(assets);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeIssueAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, assetId } = req.params; // id = issue_id
        const userId = req.tenantUser!.id!;

        if (!isValidUUID(id) || !isValidUUID(assetId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid format for Issue ID or Asset ID');
        }

        await issueAssetService.deleteIssueAsset(assetId, id, userId);

        res.status(200).json({ message: 'Issue asset soft deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete issue asset', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

