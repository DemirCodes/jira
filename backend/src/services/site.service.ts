/**
 * SITE SERVICE
 * 
 * Mevcut veritabanı fonksiyonlarıyla uyumlu:
 * - create_sites(p_site_name text, p_site_slug text, p_org_id uuid)
 * - get_sites(p_org_id uuid)
 * - get_site_id(p_site_id uuid, p_project_id uuid) -- dikkat: 2 parametre
 * - list_sites(p_org_id uuid)
 * - update_site_status(p_site_id uuid, p_new_status site_status, p_org_id uuid)
 * - delete_site(p_site_id uuid, p_org_id uuid)
 * - invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role site_role)
 * - update_site(p_site_id uuid, p_site_name text, p_site_slug text, p_is_private boolean)
 */

import { tenantPool } from '../db/tenantPool';
import {
    isValidSlug,
    isValidName,
    isValidUUID,
    containsDangerousChars,
    containsSqlPatterns
} from '../utils/regexValidator';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import {
    Site,
    SiteMember,
    SiteInvitation,
    SiteStats
} from '../types/site.types';

// ==================== IDOR PROTECTION ====================
const verifySiteBelongsToOrg = async (siteId: string, orgId: string): Promise<void> => {
    const result = await tenantPool.query(
        'SELECT 1 FROM sites WHERE site_id = $1 AND org_id = $2 AND deleted_at IS NULL',
        [siteId, orgId]
    );

    if (result.rowCount === 0) {
        log.warn('IDOR Attempt detected or Site not found', { siteId, orgId });
        // Saldırgana çok detay vermemek için NOT_FOUND dönmek en güvenlisidir
        throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Site not found in this organization');
    }
};

// ==================== VALIDATION HELPERS ====================

const validateSiteInput = (name: string, slug: string): void => {
    if (!isValidName(name, 2, 100)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME,
            'Invalid site name. Must be 2-100 characters');
    }
    if (!isValidSlug(slug, 3, 50)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG,
            'Invalid slug. Must be 3-50 characters');
    }
    if (containsDangerousChars(name) || containsDangerousChars(slug)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected');
    }
    if (containsSqlPatterns(name) || containsSqlPatterns(slug)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid patterns detected');
    }
};

const validateSiteId = (siteId: string): void => {
    if (!isValidUUID(siteId)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID format');
    }
};

const validateOrgId = (orgId: string): void => {
    if (!isValidUUID(orgId)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
    }
};

// ==================== CREATE ====================

export const createSite = async (
    name: string,
    slug: string,
    orgId: string
): Promise<string> => {
    validateSiteInput(name, slug);
    validateOrgId(orgId);

    const trimmedName = name.trim();
    const trimmedSlug = slug.toLowerCase().trim();

    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');

        // create_sites(p_site_name text, p_site_slug text, p_org_id uuid)
        const result = await client.query(
            'SELECT create_sites($1, $2, $3) as site_id',
            [trimmedName, trimmedSlug, orgId]
        );

        await client.query('COMMIT');

        if (!result.rows[0]?.site_id) {
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');
        }

        log.info('Site created', { siteId: result.rows[0].site_id, slug: trimmedSlug });
        return result.rows[0].site_id;
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error instanceof AppError) throw error;
        if (error.message?.includes('already exists') || error.code === '23505') {
            throw new AppError(ErrorCodes.SITE_SLUG_TAKEN, 'Site slug already exists in this organization');
        }
        if (error.message?.includes('permission')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
        }
        log.error('Failed to create site', { slug: trimmedSlug, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');
    } finally {
        client.release();
    }
};

// ==================== READ ====================

export const getSitesByOrg = async (orgId: string): Promise<Site[]> => {
    validateOrgId(orgId);

    try {
        // list_sites(p_org_id uuid) - sadece site_id ve site_name döner
        const result = await tenantPool.query('SELECT * FROM list_sites($1)', [orgId]);

        if (!result.rows || result.rows.length === 0) {
            return [];
        }

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
        if (error instanceof AppError) throw error;
        log.error('Failed to retrieve sites', { error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve sites');
    }
};

export const getSiteById = async (siteId: string): Promise<Site | null> => {
    validateSiteId(siteId);
    try {
        const result = await tenantPool.query(
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
};

// ==================== UPDATE ====================
export const updateSite = async (
    siteId: string,
    orgId: string, // Eklendi
    name?: string,
    slug?: string,
    isPrivate?: boolean
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId);  // Eklendi

    await verifySiteBelongsToOrg(siteId, orgId); // IDOR KONTROLÜ

    if (name && !isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
    if (slug && !isValidSlug(slug, 3, 50)) throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG);

    try {
        await tenantPool.query(
            'SELECT update_site($1, $2, $3, $4)',
            [siteId, name?.trim() || null, slug?.toLowerCase().trim() || null, isPrivate ?? null]
        );
        log.info('Site updated', { siteId });
    } catch (error: any) {
        if (error.message?.includes('permission')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
        }
        if (error.message?.includes('slug already exists')) {
            throw new AppError(ErrorCodes.SITE_SLUG_TAKEN);
        }
        log.error('Failed to update site', { siteId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update site');
    }
};

export const updateSiteStatus = async (
    siteId: string,
    newStatus: string,
    orgId?: string
): Promise<void> => {
    validateSiteId(siteId);
    if (orgId) validateOrgId(orgId);

    try {
        await tenantPool.query(
            'SELECT update_site_status($1, $2, $3)',
            [siteId, newStatus, orgId || null]
        );
        log.info('Site status updated', { siteId, newStatus });
    } catch (error: any) {
        if (error.message?.includes('permission')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
        }
        log.error('Failed to update site status', { siteId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update site status');
    }
};

// ==================== DELETE ====================

export const deleteSite = async (siteId: string, orgId?: string): Promise<void> => {
    validateSiteId(siteId);
    if (orgId) validateOrgId(orgId);

    try {
        await tenantPool.query(
            'SELECT delete_site($1, $2)',
            [siteId, orgId || null]
        );
        log.info('Site deleted', { siteId });
    } catch (error: any) {
        if (error.message?.includes('has projects')) {
            throw new AppError(ErrorCodes.SITE_CANNOT_DELETE_HAS_PROJECTS,
                'Cannot delete site with existing projects');
        }
        if (error.message?.includes('permission')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
        }
        log.error('Failed to delete site', { siteId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to delete site');
    }
};

// ==================== INVITE ====================

export const inviteToSite = async (
    friendshipCode: string,
    orgId: string,
    siteId: string,
    role: string
): Promise<string> => {
    if (!isValidUUID(friendshipCode)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    validateOrgId(orgId);
    validateSiteId(siteId);

    try {
        // invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role site_role)
        const result = await tenantPool.query(
            'SELECT invite_site($1, $2, $3, $4) as invitation_id',
            [friendshipCode, orgId, siteId, role]
        );

        if (!result.rows[0]?.invitation_id) {
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite user to site');
        }

        log.info('Site invitation sent', { siteId, role });
        return result.rows[0].invitation_id;
    } catch (error: any) {
        if (error.message?.includes('permission')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED,
                'Only org owner/admin or site admin can invite');
        }
        if (error.message?.includes('already')) {
            throw new AppError(ErrorCodes.SITE_ALREADY_EXISTS, 'User already a member');
        }
        log.error('Failed to invite to site', { siteId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite to site');
    }
};

// ==================== MEMBERS ====================

export const getSiteMembers = async (siteId: string): Promise<SiteMember[]> => {
    validateSiteId(siteId);

    try {
        const result = await tenantPool.query(
            `SELECT sm.user_id, u.user_name, u.user_email, sm.role, sm.joined_at, sm.invited_by
             FROM site_memberships sm 
             JOIN users u ON u.user_id = sm.user_id
             WHERE sm.site_id = $1 
               AND sm.membership_is_active = true 
               AND sm.deleted_at IS NULL
               AND u.deleted_at IS NULL
             ORDER BY sm.joined_at ASC`,
            [siteId]
        );

        return result.rows.map((row, index) => {
            if (!row.user_id || !row.user_name || !row.user_email || !row.role) {
                log.error('Missing required fields in site member row', { rowIndex: index, siteId });
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, `Member data corrupted at row ${index}`);
            }
            if (!isValidUUID(row.user_id)) {
                log.warn('Invalid UUID in site member row, skipping', { rowIndex: index, userId: row.user_id });
                return null;
            }
            return {
                user_id: String(row.user_id),
                user_name: String(row.user_name),
                user_email: String(row.user_email),
                role: String(row.role),
                joined_at: new Date(row.joined_at),
                invited_by: row.invited_by ? String(row.invited_by) : ''
            };
        }).filter((m): m is SiteMember => m !== null);
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        if (error.message?.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED);
        }
        log.error('Failed to retrieve site members', { siteId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site members');
    }
};
export const updateSiteMemberRole = async (
    siteId: string,
    orgId: string, // Eklendi
    memberId: string,
    role: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId); // Eklendi
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    await verifySiteBelongsToOrg(siteId, orgId); // IDOR KONTROLÜ

    try {
        const result = await tenantPool.query(
            'UPDATE site_memberships SET role = $1::site_role, updated_at = now() WHERE site_id = $2 AND user_id = $3 AND deleted_at IS NULL',
            [role, siteId, memberId]
        );
        if (result.rowCount === 0) {
            throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
        }
        log.info('Site member role updated', { siteId, memberId, role });
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        log.error('Failed to update site member role', { siteId, memberId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update member role');
    }
};


// ==================== REMOVE ====================


export const removeSiteMember = async (
    siteId: string,
    orgId: string, // Eklendi
    memberId: string
): Promise<void> => {
    validateSiteId(siteId);
    validateOrgId(orgId); // Eklendi
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    await verifySiteBelongsToOrg(siteId, orgId); // IDOR KONTROLÜ

    try {
        const result = await tenantPool.query(
            'UPDATE site_memberships SET deleted_at = now(), deleted_by = auth_current_user_id(), membership_is_active = false, updated_at = now() WHERE site_id = $1 AND user_id = $2 AND deleted_at IS NULL',
            [siteId, memberId]
        );
        if (result.rowCount === 0) {
            throw new AppError(ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
        }
        log.info('Site member removed', { siteId, memberId });
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        log.error('Failed to remove site member', { siteId, memberId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to remove member');
    }
};

// ==================== STATS ====================

export const getSiteStats = async (siteId: string): Promise<SiteStats> => {
    validateSiteId(siteId);

    try {
        const result = await tenantPool.query(
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
};


