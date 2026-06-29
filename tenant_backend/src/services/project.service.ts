/**
 * PROJECT SERVICE (SECURED WITH RLS WRAPPER & JIRA FEATURES)
 * Core Policy Matrisine Göre Sıralanmıştır.
 */

import { tenantPool } from '../db/tenantPool';
import { PoolClient } from '../../node_modules/@types/pg';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidName, isValidUUID, containsDangerousChars } from '../utils/regexValidator';
import { ProjectSummary, ProjectMember, ProjectRole } from '../types/project.types';

// ============================================================================
// ALTYAPI VE YARDIMCI FONKSİYONLAR (CORE MİMARİ)
// ============================================================================
const withRLS = async <T>(userId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const validateUUIDs = (...uuids: string[]) => {
    uuids.forEach(id => {
        if (id && !isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    });
};

const verifyProjectBelongsToSite = async (projectId: string, siteId: string, client: PoolClient): Promise<void> => {
    const result = await client.query(
        'SELECT 1 FROM projects WHERE project_id = $1 AND site_id = $2 AND deleted_at IS NULL',
        [projectId, siteId]
    );

    if (result.rowCount === 0) {
        log.warn('IDOR Attempt detected or Project not found', { projectId, siteId });
        throw new AppError(ErrorCodes.PROJECT_NOT_FOUND, 'Project not found in this site');
    }
};

// ============================================================================
// ANA LİSTE (PROJECT AUTH & ACCESS POLICY CORE FONKSİYONLARI)
// ============================================================================

// 1. CREATE
export const createProject = async (
    siteId: string,
    name: string,
    projectKey: string,
    boardType: string,
    userId: string,
    description: string = '',
    isPrivate: boolean = false
): Promise<string> => {
    validateUUIDs(siteId);
    if (!isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
    if (containsDangerousChars(name) || containsDangerousChars(description) || containsDangerousChars(projectKey)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected');
    }

    const trimmedName = name.trim();
    const trimmedDesc = description.trim().substring(0, 1000);
    const projectKeyTrimmed = projectKey.toUpperCase().trim().substring(0, 20);
    const boardTypeTrimmed = boardType.trim().substring(0, 20);

    return withRLS(userId, async (client) => {
        try {
            // Sadece veritabanı fonksiyonunu çağırıyoruz. Gerisi DB'nin sorumluluğunda!
            const result = await client.query(
                'SELECT create_project($1, $2, $3, $4, $5, $6) as project_id',
                [siteId, trimmedName, projectKeyTrimmed, boardTypeTrimmed, trimmedDesc || null, isPrivate]
            );

            if (!result.rows[0]?.project_id) {
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create project');
            }

            const newProjectId = result.rows[0].project_id;
            
            log.info('Project created', { projectId: newProjectId, siteId, projectKey: projectKeyTrimmed });
            return newProjectId;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error.message?.includes('already exists') || error.code === '23505') {
                throw new AppError(ErrorCodes.PROJECT_ALREADY_EXISTS, 'Project name or key already exists in this site');
            }
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED);
            }
            log.error('Failed to create project', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create project');
        }
    });
};


// 2. LIST
export const listProjects = async (
    siteId: string,
    userId: string,
    status?: string,
    search?: string,
    isPrivate?: boolean,
    limit: number = 50,
    offset: number = 0
): Promise<ProjectSummary[]> => {
    validateUUIDs(siteId);

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    return withRLS(userId, async (client) => {
        try {
            const safeSearch = search ? search.trim().substring(0, 100) : null;
            
            // Kendi yazdığın orijinal ve güvenli DB fonksiyonunu çağırıyoruz
            const result = await client.query(
                'SELECT * FROM list_projects($1, $2, $3, $4, $5, $6)',
                [siteId, status || null, safeSearch, isPrivate ?? null, safeLimit, safeOffset]
            );

            return result.rows as ProjectSummary[];
        } catch (error: any) {
            log.error('Failed to list projects', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to list projects');
        }
    });
};

// 3. GET
export const getProjectSummary = async (projectId: string, siteId: string, userId: string): Promise<ProjectSummary | null> => {
    validateUUIDs(projectId, siteId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT * FROM project_summary WHERE project_id = $1 AND site_id = $2',
                [projectId, siteId]
            );

            if (!result.rows.length) {
                throw new AppError(ErrorCodes.PROJECT_NOT_FOUND, 'Project not found in this site');
            }
            return result.rows[0] as ProjectSummary;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            log.error('Failed to retrieve project summary', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve project details');
        }
    });
};

// 4. UPDATE
export const updateProject = async (
    projectId: string,
    siteId: string,
    userId: string,
    name?: string,
    description?: string,
    isPrivate?: boolean,
    iconUrl?: string
): Promise<void> => {
    validateUUIDs(projectId, siteId);

    if (name) {
        if (!isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
        if (containsDangerousChars(name)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in name');
    }

    if (description && containsDangerousChars(description)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in description');
    }

    const trimmedName = name?.trim() || null;
    const trimmedDesc = description ? description.trim().substring(0, 1000) : null;

    return withRLS(userId, async (client) => {
        try {
            // ÇÖZÜM: Orijinal kolon isimlerine geri döndük (project_name ve project_description)
            const result = await client.query(
                `UPDATE projects 
                 SET project_name = COALESCE($1, project_name),
                     project_description = COALESCE($2, project_description),
                     is_private = COALESCE($3, is_private),
                     icon_url = COALESCE($4, icon_url),
                     slug = COALESCE(lower(regexp_replace($1, '[^a-zA-Z0-9]', '-', 'g')), slug),
                     updated_at = now()
                 WHERE project_id = $5 AND site_id = $6 AND deleted_at IS NULL
                 RETURNING project_id`,
                [trimmedName, trimmedDesc, isPrivate ?? null, iconUrl || null, projectId, siteId]
            );

            if (result.rowCount === 0) {
                throw new AppError(ErrorCodes.PROJECT_NOT_FOUND, 'Project not found or unauthorized');
            }

            log.info('Project updated', { projectId });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error.code === '23505') throw new AppError(ErrorCodes.PROJECT_ALREADY_EXISTS);
            log.error('Failed to update project', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update project');
        }
    });
};

// 5. DELETE
export const deleteProject = async (projectId: string, siteId: string, userId: string): Promise<void> => {
    validateUUIDs(projectId, siteId);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT delete_project($1, $2)', [projectId, siteId]);
            log.info('Project deleted', { projectId });
        } catch (error: any) {
            if (error.message?.includes('not found')) throw new AppError(ErrorCodes.PROJECT_NOT_FOUND);
            if (error.message?.includes('active issue(s)')) {
                throw new AppError(ErrorCodes.PROJECT_CANNOT_DELETE_HAS_ISSUES, 'Cannot delete project with active issues');
            }
            if (error.message?.includes('Only organization owner or project admin')) {
                throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED);
            }
            log.error('Failed to delete project', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to delete project');
        }
    });
};

// 6. RESTORE
export const restoreProject = async (projectId: string, siteId: string, userId: string): Promise<void> => {
    validateUUIDs(projectId, siteId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `UPDATE projects 
                 SET deleted_at = NULL, updated_at = now()
                 WHERE project_id = $1 AND site_id = $2 AND deleted_at IS NOT NULL
                 RETURNING project_id`,
                [projectId, siteId]
            );

            if (result.rowCount === 0) throw new AppError(ErrorCodes.PROJECT_NOT_FOUND, 'Deleted project not found');
            log.info('Project restored successfully', { projectId });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to restore project');
        }
    });
};

// 7. INVITE
export const inviteToProject = async (
    friendshipCode: string,
    orgId: string,
    siteId: string,
    projectId: string,
    role: string,
    userId: string
): Promise<void> => {
    validateUUIDs(friendshipCode, orgId, siteId, projectId);

    if (containsDangerousChars(role)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in role');
    }

    return withRLS(userId, async (client) => {
        try {
            await client.query(
                'SELECT invite_project($1, $2, $3, $4, $5::project_role)',
                [friendshipCode, orgId, siteId, projectId, role]
            );
            log.info('User invited to project', { projectId, role });
        } catch (error: any) {
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, error.message);
            }
            if (error.message?.includes('not found')) throw new AppError(ErrorCodes.PROJECT_NOT_FOUND);
            if (error.message?.includes('already has a membership')) {
                throw new AppError(ErrorCodes.PROJECT_ALREADY_EXISTS, 'User is already a member');
            }
            log.error('Failed to invite to project', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite user to project');
        }
    });
};

// ============================================================================
// EKSTRA FONKSİYONLAR (MATRİS HARİCİ DİĞER İŞLEMLER)
// ============================================================================

export const updateProjectStatus = async (
    projectId: string,
    siteId: string,
    newStatus: string,
    userId: string
): Promise<void> => {
    validateUUIDs(projectId, siteId);

    if (containsDangerousChars(newStatus)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in status');
    }

    return withRLS(userId, async (client) => {
        try {
            await client.query(
                'SELECT update_project_status($1, $2::project_status, $3)',
                [projectId, newStatus, siteId]
            );
            log.info('Project status updated', { projectId, newStatus });
        } catch (error: any) {
            if (error.message?.includes('Project not found')) {
                throw new AppError(ErrorCodes.PROJECT_NOT_FOUND);
            }
            if (error.message?.includes('Permission denied') || error.message?.includes('Only')) {
                throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED);
            }
            log.error('Failed to update project status', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update project status');
        }
    });
};

export const getProjectMembers = async (
    projectId: string,
    siteId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
): Promise<ProjectMember[]> => {
    validateUUIDs(projectId, siteId);

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `SELECT pm.user_id, u.user_name, u.user_email, pm.role, pm.joined_at, pm.invited_by
                 FROM project_memberships pm 
                 JOIN users u ON u.user_id = pm.user_id
                 JOIN projects p ON p.project_id = pm.project_id
                 WHERE pm.project_id = $1 
                   AND p.site_id = $2
                   AND pm.membership_is_active = true 
                   AND pm.deleted_at IS NULL
                   AND u.deleted_at IS NULL
                   AND p.deleted_at IS NULL
                 ORDER BY pm.joined_at ASC
                 LIMIT $3 OFFSET $4`,
                [projectId, siteId, safeLimit, safeOffset]
            );

            return result.rows.map((row: any) => ({
                user_id: String(row.user_id),
                user_name: String(row.user_name),
                user_email: String(row.user_email),
                role: row.role as ProjectRole,
                joined_at: new Date(row.joined_at),
                invited_by: row.invited_by ? String(row.invited_by) : ''
            }));
        } catch (error: any) {
            log.error('Failed to retrieve project members', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve project members');
        }
    });
};