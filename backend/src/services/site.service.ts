/**
 * SITE SERVICE (SECURED WITH RLS WRAPPER)
 */

import { tenantPool } from '../db/tenantPool';
import { PoolClient } from 'pg';
import {
    isValidSlug,
    isValidName,
    isValidUUID,
    containsDangerousChars,
    containsSqlPatterns
} from '../utils/regexValidator';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { Site, SiteMember, SiteStats } from '../types/site.types';

// ==================== GÜVENLİ RLS WRAPPER ====================
const withRLS = async <T>(userId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        // Sadece bu işleme özel (true) RLS bağlamını kur
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

// ==================== IDOR PROTECTION ====================
const verifySiteBelongsToOrg = async (siteId: string, orgId: string, client: PoolClient): Promise<void> => {
    const result = await client.query(
        'SELECT 1 FROM sites WHERE site_id = $1 AND org_id = $2 AND deleted_at IS NULL',
        [siteId, orgId]
    );

    if (result.rowCount === 0) {
        log.warn('IDOR Attempt detected or Site not found', { siteId, orgId });
        throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Site not found in this organization');
    }
};

// ==================== VALIDATION HELPERS ====================
const validateSiteInput = (name: string, slug: string): void => {
    if (!isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME, 'Invalid site name');
    if (!isValidSlug(slug, 3, 50)) throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG, 'Invalid slug');
    if (containsDangerousChars(name) || containsDangerousChars(slug)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters');
    if (containsSqlPatterns(name) || containsSqlPatterns(slug)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid patterns');
};

const validateSiteId = (siteId: string): void => {
    if (!isValidUUID(siteId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
};

const validateOrgId = (orgId: string): void => {
    if (!isValidUUID(orgId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid org ID');
};

// ==================== CREATE ====================
export const createSite = async (
    name: string,
    slug: string,
    orgId: string,
    userId: string
): Promise<string> => {
    validateSiteInput(name, slug);
    validateOrgId(orgId);

    const trimmedName = name.trim();
    const trimmedSlug = slug.toLowerCase().trim();

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT create_sites($1, $2, $3) as site_id',
                [trimmedName, trimmedSlug, orgId]
            );

            if (!result.rows[0]?.site_id) throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');

            log.info('Site created', { siteId: result.rows[0].site_id, slug: trimmedSlug });
            return result.rows[0].site_id;
        } catch (error: any) {
            if (error.code === '23505' || error.message?.includes('already exists')) {
                throw new AppError(ErrorCodes.SITE_SLUG_TAKEN, 'Site slug already exists in this organization');
            }
            if (error.message?.includes('permission')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            log.error('Failed to create site', { slug: trimmedSlug, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');
        }
    });
};

// ==================== READ ====================
export const getSitesByOrg = async (orgId: string, userId: string): Promise<Site[]> => {
    validateOrgId(orgId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query('SELECT * FROM list_sites($1)', [orgId]);
            if (!result.rows || result.rows.length === 0) return [];

            return result.rows.map(row => ({
                site_id: row.site_id,
                org_id: orgId,
                site_name: String(row.site_name),
                site_slug: '',
                site_status: 'active',
                is_private: false,
                created_by: '',
                created_at: new Date(),
                updated_at: new Date()
            }));
        } catch (error) {
            log.error('Failed to retrieve sites', { error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve sites');
        }
    });
};

export const getSiteById = async (siteId: string, userId: string): Promise<Site | null> => {
    validateSiteId(siteId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `SELECT site_id, org_id, site_name, site_slug, site_status, is_private, created_by, created_at, updated_at 
                 FROM sites WHERE site_id = $1 AND deleted_at IS NULL`,
                [siteId]
            );
            if (!result.rows?.length) return null;
            const row = result.rows[0];
            return {
                site_id: row.site_id,
                org_id: row.org_id,
                site_name: String(row.site_name),
                site_slug: String(row.site_slug || ''),
                site_status: row.site_status || 'active',
                is_private: row.is_private || false,
                created_by: row.created_by || '',
                created_at: new Date(row.created_at),
                updated_at: new Date(row.updated_at || row.created_at)
            };
        } catch (error: any) {
            log.error('Failed to retrieve site', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site');
        }
    });
};

// ==================== UPDATE ====================
export const updateSite = async (
    siteId: string,
    orgId: string,
    name: string | undefined,
    slug: string | undefined,
    isPrivate: boolean | undefined,
    userId: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);

    if (name && !isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
    if (slug && !isValidSlug(slug, 3, 50)) throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG);

    return withRLS(userId, async (client) => {
        await verifySiteBelongsToOrg(siteId, orgId, client);

        try {
            await client.query(
                'SELECT update_site($1, $2, $3, $4)',
                [siteId, name?.trim() || null, slug?.toLowerCase().trim() || null, isPrivate ?? null]
            );
            log.info('Site updated', { siteId });
        } catch (error: any) {
            if (error.message?.includes('permission')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            if (error.message?.includes('slug already exists')) throw new AppError(ErrorCodes.SITE_SLUG_TAKEN);
            log.error('Failed to update site', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update site');
        }
    });
};

export const updateSiteStatus = async (
    siteId: string,
    newStatus: string,
    orgId: string,
    userId: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);

    return withRLS(userId, async (client) => {
        try {
            await client.query(
                'SELECT update_site_status($1, $2, $3)',
                [siteId, newStatus, orgId]
            );
            log.info('Site status updated', { siteId, newStatus });
        } catch (error: any) {
            if (error.message?.includes('permission')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            log.error('Failed to update site status', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update site status');
        }
    });
};

// ==================== DELETE ====================
export const deleteSite = async (siteId: string, orgId: string, userId: string): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT delete_site($1, $2)', [siteId, orgId]);
            log.info('Site deleted', { siteId });
        } catch (error: any) {
            if (error.message?.includes('has projects')) {
                throw new AppError(ErrorCodes.SITE_CANNOT_DELETE_HAS_PROJECTS, 'Cannot delete site with existing projects');
            }
            if (error.message?.includes('permission')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            log.error('Failed to delete site', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to delete site');
        }
    });
};

// ==================== INVITE ====================
export const inviteToSite = async (
    friendshipCode: string,
    orgId: string,
    siteId: string,
    role: string,
    userId: string
): Promise<string> => {
    if (!isValidUUID(friendshipCode)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    validateOrgId(orgId);
    validateSiteId(siteId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT invite_site($1, $2, $3, $4) as invitation_id',
                [friendshipCode, orgId, siteId, role]
            );

            if (!result.rows[0]?.invitation_id) throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite user to site');

            log.info('Site invitation sent', { siteId, role });
            return result.rows[0].invitation_id;
        } catch (error: any) {
            if (error.message?.includes('permission')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            if (error.message?.includes('already')) throw new AppError(ErrorCodes.SITE_ALREADY_EXISTS, 'User already a member');
            log.error('Failed to invite to site', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite to site');
        }
    });
};

// ==================== MEMBERS ====================
export const getSiteMembers = async (
    siteId: string, 
    userId: string,
    limit: number = 50,
    offset: number = 0
): Promise<SiteMember[]> => {
    validateSiteId(siteId);
    
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.min(Math.max(0, offset), 10000);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `SELECT sm.user_id, u.user_name, u.user_email, sm.role, sm.joined_at, sm.invited_by
                 FROM site_memberships sm 
                 JOIN users u ON u.user_id = sm.user_id
                 WHERE sm.site_id = $1 
                   AND sm.membership_is_active = true 
                   AND sm.deleted_at IS NULL
                   AND u.deleted_at IS NULL
                 ORDER BY sm.joined_at ASC
                 LIMIT $2 OFFSET $3`,
                [siteId, safeLimit, safeOffset]
            );

            return result.rows.map((row) => {
                const roleValue = String(row.role);
                return {
                    user_id: String(row.user_id),
                    user_name: String(row.user_name),
                    user_email: String(row.user_email),
                    role: roleValue as SiteMember['role'],
                    joined_at: new Date(row.joined_at),
                    invited_by: row.invited_by ? String(row.invited_by) : ''
                };
            });
        } catch (error: any) {
            if (error.message?.includes('PERMISSION_DENIED')) throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
            log.error('Failed to retrieve site members', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site members');
        }
    });
};

export const updateSiteMemberRole = async (
    siteId: string,
    orgId: string,
    memberId: string,
    role: string,
    userId: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        await verifySiteBelongsToOrg(siteId, orgId, client);

        try {
            const result = await client.query(
                'UPDATE site_memberships SET role = $1::site_role, updated_at = now() WHERE site_id = $2 AND user_id = $3 AND deleted_at IS NULL',
                [role, siteId, memberId]
            );
            if (result.rowCount === 0) throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
            log.info('Site member role updated', { siteId, memberId, role });
        } catch (error: any) {
            log.error('Failed to update site member role', { siteId, memberId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update member role');
        }
    });
};

// ==================== REMOVE ====================
export const removeSiteMember = async (
    siteId: string,
    orgId: string,
    memberId: string,
    userId: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        await verifySiteBelongsToOrg(siteId, orgId, client);

        try {
            const result = await client.query(
                'UPDATE site_memberships SET deleted_at = now(), deleted_by = auth_current_user_id(), membership_is_active = false, updated_at = now() WHERE site_id = $1 AND user_id = $2 AND deleted_at IS NULL',
                [siteId, memberId]
            );
            if (result.rowCount === 0) throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
            log.info('Site member removed', { siteId, memberId });
        } catch (error: any) {
            log.error('Failed to remove site member', { siteId, memberId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to remove member');
        }
    });
};

// ==================== STATS ====================
export const getSiteStats = async (siteId: string, userId: string): Promise<SiteStats> => {
    validateSiteId(siteId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `SELECT 
                    (SELECT COUNT(*) FROM site_memberships WHERE site_id = $1 AND membership_is_active = true AND deleted_at IS NULL) as total_members,
                    (SELECT COUNT(*) FROM projects WHERE site_id = $1 AND deleted_at IS NULL) as total_projects,
                    (SELECT COUNT(*) FROM projects WHERE site_id = $1 AND project_status = 'active' AND deleted_at IS NULL) as active_projects,
                    (SELECT created_at FROM sites WHERE site_id = $1 AND deleted_at IS NULL) as created_at`,
                [siteId]
            );

            return result.rows[0] || { total_members: 0, total_projects: 0, active_projects: 0, created_at: new Date() };
        } catch (error: any) {
            log.error('Failed to retrieve site stats', { siteId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site stats');
        }
    });
};