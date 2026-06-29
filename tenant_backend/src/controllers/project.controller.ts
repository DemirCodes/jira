/**
 * PROJECT CONTROLLER
 * Zero-Trust & RBAC (Role-Based Access Control) mimarisine göre güncellendi.
 * Yetki kontrolleri ProjectAccessPolicy üzerinden merkezi olarak yapılır.
 */

import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import { ProjectAccessPolicy } from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';
import * as projectAssetService from '../services/projectAsset.service';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { site_id, name, project_key, board_type, description, is_private } = req.body;

        if (!site_id || !name || !project_key || !board_type) {
            res.status(400).json({ error: 'site_id, name, project_key, and board_type are required' });
            return;
        }

        if (!isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site_id format');

        // YETKİ KONTROLÜ: Sadece Site Admin oluşturabilir
        await ProjectAccessPolicy.validateCreation(userId, site_id);

        const projectId = await projectService.createProject(
            site_id, 
            name, 
            project_key, 
            board_type, 
            userId, 
            description, 
            is_private
        );
        
        res.status(201).json({ project_id: projectId });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to create project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== READ (LIST & GET) ====================
export const list = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const site_id = req.query.site_id as string;
        const status = req.query.status as string;
        const search = req.query.search as string;
        const is_private = req.query.is_private ? req.query.is_private === 'true' : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        if (!site_id) {
            res.status(400).json({ error: 'site_id query parameter is required' });
            return;
        }
        if (!isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site_id format');

        // YETKİ KONTROLÜ: Sitede olan herkes projeleri listeleyebilir
        await ProjectAccessPolicy.validateRead(userId, site_id);

        const projects = await projectService.listProjects(site_id, userId, status, search, is_private, limit, offset);
        res.json(projects);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list projects', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // projectId
        const userId = req.userId!;
        const site_id = req.query.site_id as string;

        if (!site_id) {
            res.status(400).json({ error: 'site_id query parameter is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Site üyesi projeyi görüntüleyebilir
        await ProjectAccessPolicy.validateRead(userId, site_id);

        const project = await projectService.getProjectSummary(id, site_id, userId);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to get project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== WRITE (UPDATE, STATUS, INVITE, DELETE, RESTORE) ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // projectId
        const userId = req.userId!;
        const { site_id, name, description, is_private, icon_url } = req.body;

        if (!site_id) {
            res.status(400).json({ error: 'site_id is required in body' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin değiştirebilir
        await ProjectAccessPolicy.validateManagement(userId, id); 

        await projectService.updateProject(id, site_id, userId, name, description, is_private, icon_url);
        res.json({ message: 'Project updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { site_id, status } = req.body;

        if (!site_id || !status) {
            res.status(400).json({ error: 'site_id and status are required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin
        await ProjectAccessPolicy.validateManagement(userId, id);

        await projectService.updateProjectStatus(id, site_id, status, userId);
        res.json({ message: 'Project status updated successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to update project status', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { friendshipCode, orgId, site_id, role } = req.body;

        if (!friendshipCode || !orgId || !site_id || !role) {
            res.status(400).json({ error: 'friendshipCode, orgId, site_id, and role are required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id) || !isValidUUID(orgId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin
        await ProjectAccessPolicy.validateManagement(userId, id);

        await projectService.inviteToProject(friendshipCode, orgId, site_id, id, role, userId);
        res.status(201).json({ message: 'User invited to project successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to invite user', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        
        const site_id = req.query.site_id as string || req.body.site_id;

        if (!site_id) {
            res.status(400).json({ error: 'site_id is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin
        await ProjectAccessPolicy.validateManagement(userId, id);

        await projectService.deleteProject(id, site_id, userId);
        res.json({ message: 'Project soft deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const restore = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { site_id } = req.body;

        if (!site_id) {
            res.status(400).json({ error: 'site_id is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Sadece Project Admin
        await ProjectAccessPolicy.validateManagement(userId, id);

        await projectService.restoreProject(id, site_id, userId);
        res.json({ message: 'Project restored successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to restore project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== MEMBERS ====================
export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const site_id = req.query.site_id as string;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        if (!site_id) {
            res.status(400).json({ error: 'site_id query parameter is required' });
            return;
        }
        if (!isValidUUID(id) || !isValidUUID(site_id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        // YETKİ KONTROLÜ: Proje üyelerini görmek için site üyesi olmak yeterli
        await ProjectAccessPolicy.validateRead(userId, site_id);

        const members = await projectService.getProjectMembers(id, site_id, userId, limit, offset);
        res.json(members);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to list project members', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const uploadProjectAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // project_id
        const userId = req.userId!; // uploaded_by
        const { asset_type, metadata } = req.body; 

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid Project ID format');
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const dummy_storage_key = `projects/${id}/assets/${Date.now()}_${req.file.originalname}`;

        const assetId = await projectAssetService.createProjectAsset({
            project_id: id,
            uploaded_by: userId,
            asset_type: asset_type || 'file', // enum'a göre image veya file
            file_name: req.file.originalname,
            mime_type: req.file.mimetype,
            byte_size: req.file.size,
            storage_key: dummy_storage_key,
            checksum: (req.file as any).checksum, 
            metadata: metadata ? JSON.parse(metadata) : null
        });

        res.status(201).json({ 
            message: 'Project asset scanned, uploaded and saved successfully',
            project_asset_id: assetId
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to handle project asset upload', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const listProjectAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // project_id
        const userId = req.userId!;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

        if (!isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

        const assets = await projectAssetService.listProjectAssets(id, userId, limit, offset);
        res.json(assets);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeProjectAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, assetId } = req.params; // id = project_id
        const userId = req.userId!;

        if (!isValidUUID(id) || !isValidUUID(assetId)) {
            throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid format for Project ID or Asset ID');
        }

        await projectAssetService.deleteProjectAsset(assetId, id, userId);

        res.status(200).json({ message: 'Project asset soft deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete project asset', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};