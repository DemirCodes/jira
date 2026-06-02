import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import * as authService from '../services/authorization.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { site_id, name, description, is_private } = req.body;

        // Yetki: Site admin veya Org Owner
        await authService.requireSiteAdminOrOrgOwner(userId, site_id);

        const projectId = await projectService.createProject(site_id, name, description, is_private);
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

// ==================== READ ====================
export const listBySite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { siteId } = req.params;
        const { status, search, is_private, limit, offset } = req.query;
        const userId = req.userId!;

        // Yetki: Site üyesi olmalı
        await authService.requireSiteMember(userId, siteId);

        const projects = await projectService.listProjects(
            siteId,
            status as string,
            search as string,
            is_private === 'true' ? true : (is_private === 'false' ? false : undefined),
            limit ? parseInt(limit as string, 10) : 50,
            offset ? parseInt(offset as string, 10) : 0
        );
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
        const { id } = req.params;
        const { site_id } = req.query; // Query params'dan alıyoruz
        const userId = req.userId!;

        if (!site_id) throw new AppError(ErrorCodes.VALIDATION_MISSING_FIELD, 'site_id query parameter is required');

        // Yetki: Project member, Site Admin veya Org Owner
        await authService.requireSiteMember(userId, site_id as string);

        const project = await projectService.getProjectSummary(id, site_id as string);
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

// ==================== UPDATE ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { site_id, name, description, is_private } = req.body;

        // Yetki: Project Admin
        await authService.requireProjectAdmin(userId, id);

        await projectService.updateProject(id, site_id, name, description, is_private);
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

        // Yetki: Project Admin
        await authService.requireProjectAdmin(userId, id);

        await projectService.updateProjectStatus(id, site_id, status);
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

// ==================== DELETE ====================
export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { site_id } = req.body;

        if (!site_id) throw new AppError(ErrorCodes.VALIDATION_MISSING_FIELD, 'site_id is required');

        // Yetki: Project Admin
        await authService.requireProjectAdmin(userId, id);

        await projectService.deleteProject(id, site_id);
        res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to delete project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==================== INVITE & MEMBERS ====================
export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const { org_id, site_id, friendshipCode, role } = req.body;

        // DB fonksiyonu yetki kontrolünü çok kapsamlı yapıyor, 
        // Ancak biz Controller katmanında en azından kullanıcının bu site'nin bir parçası olduğundan emin olalım.
        await authService.requireSiteMember(userId, site_id);

        await projectService.inviteToProject(friendshipCode, org_id, site_id, id, role);
        res.status(201).json({ message: 'User invited to project' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        log.error('Controller: Failed to invite to project', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { site_id } = req.query;
        const userId = req.userId!;

        if (!site_id) throw new AppError(ErrorCodes.VALIDATION_MISSING_FIELD, 'site_id query param is required');

        // Yetki: Project member
        await authService.requireProjectMember(userId, id);

        const members = await projectService.getProjectMembers(id, site_id as string);
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