"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteStats = exports.removeSiteMember = exports.updateSiteMemberRole = exports.getSiteMembers = exports.inviteToSite = exports.deleteSite = exports.updateSiteStatus = exports.updateSite = exports.getSiteById = exports.getSitesByOrg = exports.createSite = void 0;
const tenantPool_1 = require("../db/tenantPool");
const regexValidator_1 = require("../utils/regexValidator");
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
// ==================== VALIDATION HELPERS ====================
const validateSiteInput = (name, slug) => {
    if (!(0, regexValidator_1.isValidName)(name, 2, 100)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_NAME, 'Invalid site name. Must be 2-100 characters');
    }
    if (!(0, regexValidator_1.isValidSlug)(slug, 3, 50)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_SLUG, 'Invalid slug. Must be 3-50 characters');
    }
    if ((0, regexValidator_1.containsDangerousChars)(name) || (0, regexValidator_1.containsDangerousChars)(slug)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected');
    }
    if ((0, regexValidator_1.containsSqlPatterns)(name) || (0, regexValidator_1.containsSqlPatterns)(slug)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid patterns detected');
    }
};
const validateSiteId = (siteId) => {
    if (!(0, regexValidator_1.isValidUUID)(siteId)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID format');
    }
};
const validateOrgId = (orgId) => {
    if (!(0, regexValidator_1.isValidUUID)(orgId)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
    }
};
// ==================== CREATE ====================
const createSite = async (name, slug, orgId) => {
    validateSiteInput(name, slug);
    validateOrgId(orgId);
    const trimmedName = name.trim();
    const trimmedSlug = slug.toLowerCase().trim();
    const client = await tenantPool_1.tenantPool.connect();
    try {
        await client.query('BEGIN');
        // create_sites(p_site_name text, p_site_slug text, p_org_id uuid)
        const result = await client.query('SELECT create_sites($1, $2, $3) as site_id', [trimmedName, trimmedSlug, orgId]);
        await client.query('COMMIT');
        if (!result.rows[0]?.site_id) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');
        }
        logger_1.log.info('Site created', { siteId: result.rows[0].site_id, slug: trimmedSlug });
        return result.rows[0].site_id;
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message?.includes('already exists') || error.code === '23505') {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_SLUG_TAKEN, 'Site slug already exists in this organization');
        }
        if (error.message?.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED);
        }
        logger_1.log.error('Failed to create site', { slug: trimmedSlug, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create site');
    }
    finally {
        client.release();
    }
};
exports.createSite = createSite;
// ==================== READ ====================
const getSitesByOrg = async (orgId) => {
    validateOrgId(orgId);
    try {
        // list_sites(p_org_id uuid) - sadece site_id ve site_name döner
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM list_sites($1)', [orgId]);
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
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        logger_1.log.error('Failed to retrieve sites', { error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve sites');
    }
};
exports.getSitesByOrg = getSitesByOrg;
const getSiteById = async (siteId) => {
    validateSiteId(siteId);
    try {
        const result = await tenantPool_1.tenantPool.query(`SELECT site_id, org_id, site_name, site_slug, site_status, is_private, created_by, created_at, updated_at 
             FROM sites WHERE site_id = $1 AND deleted_at IS NULL`, [siteId]);
        if (!result.rows?.length)
            return null;
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
    }
    catch (error) {
        logger_1.log.error('Failed to retrieve site', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site');
    }
};
exports.getSiteById = getSiteById;
// ==================== UPDATE ====================
const updateSite = async (siteId, name, slug, isPrivate) => {
    validateSiteId(siteId);
    if (name && !(0, regexValidator_1.isValidName)(name, 2, 100))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_NAME);
    if (slug && !(0, regexValidator_1.isValidSlug)(slug, 3, 50))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_SLUG);
    try {
        await tenantPool_1.tenantPool.query('SELECT update_site($1, $2, $3, $4)', [siteId, name?.trim() || null, slug?.toLowerCase().trim() || null, isPrivate ?? null]);
        logger_1.log.info('Site updated', { siteId });
    }
    catch (error) {
        if (error.message?.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED);
        }
        if (error.message?.includes('slug already exists')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_SLUG_TAKEN);
        }
        logger_1.log.error('Failed to update site', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to update site');
    }
};
exports.updateSite = updateSite;
const updateSiteStatus = async (siteId, newStatus, orgId) => {
    validateSiteId(siteId);
    if (orgId)
        validateOrgId(orgId);
    try {
        await tenantPool_1.tenantPool.query('SELECT update_site_status($1, $2, $3)', [siteId, newStatus, orgId || null]);
        logger_1.log.info('Site status updated', { siteId, newStatus });
    }
    catch (error) {
        if (error.message?.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED);
        }
        logger_1.log.error('Failed to update site status', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to update site status');
    }
};
exports.updateSiteStatus = updateSiteStatus;
// ==================== DELETE ====================
const deleteSite = async (siteId, orgId) => {
    validateSiteId(siteId);
    if (orgId)
        validateOrgId(orgId);
    try {
        await tenantPool_1.tenantPool.query('SELECT delete_site($1, $2)', [siteId, orgId || null]);
        logger_1.log.info('Site deleted', { siteId });
    }
    catch (error) {
        if (error.message?.includes('has projects')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_CANNOT_DELETE_HAS_PROJECTS, 'Cannot delete site with existing projects');
        }
        if (error.message?.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED);
        }
        logger_1.log.error('Failed to delete site', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to delete site');
    }
};
exports.deleteSite = deleteSite;
// ==================== INVITE ====================
const inviteToSite = async (friendshipCode, orgId, siteId, role) => {
    if (!(0, regexValidator_1.isValidUUID)(friendshipCode))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    validateOrgId(orgId);
    validateSiteId(siteId);
    try {
        // invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role site_role)
        const result = await tenantPool_1.tenantPool.query('SELECT invite_site($1, $2, $3, $4) as invitation_id', [friendshipCode, orgId, siteId, role]);
        if (!result.rows[0]?.invitation_id) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to invite user to site');
        }
        logger_1.log.info('Site invitation sent', { siteId, role });
        return result.rows[0].invitation_id;
    }
    catch (error) {
        if (error.message?.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'Only org owner/admin or site admin can invite');
        }
        if (error.message?.includes('already')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_ALREADY_EXISTS, 'User already a member');
        }
        logger_1.log.error('Failed to invite to site', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to invite to site');
    }
};
exports.inviteToSite = inviteToSite;
// ==================== MEMBERS ====================
const getSiteMembers = async (siteId) => {
    validateSiteId(siteId);
    try {
        const result = await tenantPool_1.tenantPool.query(`SELECT sm.user_id, u.user_name, u.user_email, sm.role, sm.joined_at, sm.invited_by
             FROM site_memberships sm 
             JOIN users u ON u.user_id = sm.user_id
             WHERE sm.site_id = $1 
               AND sm.membership_is_active = true 
               AND sm.deleted_at IS NULL
               AND u.deleted_at IS NULL
             ORDER BY sm.joined_at ASC`, [siteId]);
        return result.rows.map((row, index) => {
            if (!row.user_id || !row.user_name || !row.user_email || !row.role) {
                logger_1.log.error('Missing required fields in site member row', { rowIndex: index, siteId });
                throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, `Member data corrupted at row ${index}`);
            }
            if (!(0, regexValidator_1.isValidUUID)(row.user_id)) {
                logger_1.log.warn('Invalid UUID in site member row, skipping', { rowIndex: index, userId: row.user_id });
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
        }).filter((m) => m !== null);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message?.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED);
        }
        logger_1.log.error('Failed to retrieve site members', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site members');
    }
};
exports.getSiteMembers = getSiteMembers;
const updateSiteMemberRole = async (siteId, memberId, role) => {
    validateSiteId(siteId);
    if (!(0, regexValidator_1.isValidUUID)(memberId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        const result = await tenantPool_1.tenantPool.query('UPDATE site_memberships SET role = $1::site_role, updated_at = now() WHERE site_id = $2 AND user_id = $3 AND deleted_at IS NULL', [role, siteId, memberId]);
        if (result.rowCount === 0) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
        }
        logger_1.log.info('Site member role updated', { siteId, memberId, role });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        logger_1.log.error('Failed to update site member role', { siteId, memberId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to update member role');
    }
};
exports.updateSiteMemberRole = updateSiteMemberRole;
const removeSiteMember = async (siteId, memberId) => {
    validateSiteId(siteId);
    if (!(0, regexValidator_1.isValidUUID)(memberId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        const result = await tenantPool_1.tenantPool.query('UPDATE site_memberships SET deleted_at = now(), deleted_by = auth_current_user_id(), membership_is_active = false, updated_at = now() WHERE site_id = $1 AND user_id = $2 AND deleted_at IS NULL', [siteId, memberId]);
        if (result.rowCount === 0) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_NOT_FOUND, 'Member not found in this site');
        }
        logger_1.log.info('Site member removed', { siteId, memberId });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        logger_1.log.error('Failed to remove site member', { siteId, memberId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to remove member');
    }
};
exports.removeSiteMember = removeSiteMember;
// ==================== STATS ====================
const getSiteStats = async (siteId) => {
    validateSiteId(siteId);
    try {
        const result = await tenantPool_1.tenantPool.query(`SELECT 
                (SELECT COUNT(*) FROM site_memberships WHERE site_id = $1 AND membership_is_active = true AND deleted_at IS NULL) as total_members,
                (SELECT COUNT(*) FROM projects WHERE site_id = $1 AND deleted_at IS NULL) as total_projects,
                (SELECT COUNT(*) FROM projects WHERE site_id = $1 AND project_status = 'active' AND deleted_at IS NULL) as active_projects,
                (SELECT created_at FROM sites WHERE site_id = $1 AND deleted_at IS NULL) as created_at`, [siteId]);
        return result.rows[0] || { total_members: 0, total_projects: 0, active_projects: 0, created_at: new Date() };
    }
    catch (error) {
        logger_1.log.error('Failed to retrieve site stats', { siteId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve site stats');
    }
};
exports.getSiteStats = getSiteStats;
//# sourceMappingURL=site.service.js.map