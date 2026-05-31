"use strict";
/**
 * ORGANIZATION SERVICE
 *
 * Tüm yetkilendirme auth_current_user_id() ile DB katmanında yapılır.
 * Servis sadece validasyon, tip kontrolü ve veri dönüşümünden sorumludur.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveOrganization = exports.getOrganizationStats = exports.cancelInvitation = exports.getInvitationOrgId = exports.getPendingInvitations = exports.removeMember = exports.updateMemberRole = exports.getOrganizationMembers = exports.inviteToOrganization = exports.deleteOrganization = exports.updateOrganization = exports.getOrganizationById = exports.getUserOrganizations = exports.createOrganization = void 0;
const tenantPool_1 = require("../db/tenantPool");
const regexValidator_1 = require("../utils/regexValidator");
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
// ==================== YARDIMCI ====================
const getCurrentUserId = async () => {
    const result = await tenantPool_1.tenantPool.query('SELECT current_setting($1, true) as user_id', ['app.current_user_id']);
    const userId = result.rows[0]?.user_id;
    if (!userId)
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.AUTH_NO_TOKEN, 'User not authenticated');
    return userId;
};
// ==================== VALIDATION HELPERS ====================
const validateOrgInput = (name, slug) => {
    if (!(0, regexValidator_1.isValidName)(name, 2, 100)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_NAME, 'Invalid organization name. Must be 2-100 characters and contain only letters, spaces, dots and hyphens');
    }
    if (!(0, regexValidator_1.isValidSlug)(slug, 3, 50)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_SLUG, 'Invalid slug. Must be 3-50 characters and contain only lowercase letters, numbers and hyphens');
    }
    if ((0, regexValidator_1.containsDangerousChars)(name) || (0, regexValidator_1.containsDangerousChars)(slug)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected in input');
    }
    if ((0, regexValidator_1.containsSqlPatterns)(name) || (0, regexValidator_1.containsSqlPatterns)(slug)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid patterns detected in input');
    }
};
const validateOrgId = (orgId) => {
    if (!(0, regexValidator_1.isValidUUID)(orgId)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
    }
};
const validateFriendshipCode = (code) => {
    if (!(0, regexValidator_1.isValidUUID)(code)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid friendship code format');
    }
};
const validateRole = (role) => {
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
};
// ==================== CREATE ====================
const createOrganization = async (userId, name, slug, description) => {
    validateOrgInput(name, slug);
    if (description) {
        if (description.length > 1000) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Description cannot exceed 1000 characters');
        }
        if ((0, regexValidator_1.containsDangerousChars)(description)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid characters in description');
        }
    }
    const trimmedName = name.trim();
    const trimmedSlug = slug.toLowerCase().trim();
    const trimmedDescription = description ? description.trim().substring(0, 1000) : null;
    const client = await tenantPool_1.tenantPool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('SELECT create_organization($1, $2, $3, $4) as org_id', [userId, trimmedName, trimmedSlug, trimmedDescription]);
        await client.query('COMMIT');
        if (!result.rows[0]?.org_id) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create organization');
        }
        logger_1.log.info('Organization created', { orgId: result.rows[0].org_id, slug: trimmedSlug });
        return result.rows[0].org_id;
    }
    catch (error) {
        await client.query('ROLLBACK');
        // AppError ise direkt fırlat
        if (error instanceof errorCodes_1.AppError)
            throw error;
        // DB hatalarını yakala
        if (error.message?.includes('already exists') || error.code === '23505') {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_SLUG_TAKEN, 'Slug already exists');
        }
        if (error.message?.includes('limit reached')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_LIMIT_REACHED, 'Organization creation limit reached');
        }
        if (error.message?.includes('not found') || error.message?.includes('inactive')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.AUTH_USER_NOT_FOUND, 'User not found or inactive');
        }
        logger_1.log.error('Failed to create organization', { slug: trimmedSlug, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create organization');
    }
    finally {
        client.release();
    }
};
exports.createOrganization = createOrganization;
// ==================== READ ====================
const getUserOrganizations = async () => {
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM get_user_organizations()');
        if (!result.rows || result.rows.length === 0) {
            logger_1.log.debug('No organizations found for user');
            return [];
        }
        const organizations = result.rows.map((row, index) => {
            if (!row.org_id || !row.org_name || !row.slug || !row.org_status) {
                logger_1.log.error('Missing required fields in organization row', {
                    rowIndex: index,
                    row: { org_id: row.org_id, org_name: row.org_name }
                });
                throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, `Organization data corrupted at row ${index}`);
            }
            if (!(0, regexValidator_1.isValidUUID)(row.org_id) || (row.created_by && !(0, regexValidator_1.isValidUUID)(row.created_by))) {
                logger_1.log.error('Invalid UUID format in organization row', {
                    rowIndex: index,
                    org_id: row.org_id,
                    created_by: row.created_by
                });
                throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, `Invalid UUID format at row ${index}`);
            }
            return {
                org_id: row.org_id,
                org_name: String(row.org_name),
                org_description: row.org_description ? String(row.org_description) : null,
                slug: String(row.slug),
                org_status: String(row.org_status),
                created_at: new Date(row.created_at),
                created_by: String(row.created_by),
                user_role: row.user_role ? String(row.user_role) : undefined
            };
        });
        logger_1.log.info(`Retrieved ${organizations.length} organizations`);
        return organizations;
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        logger_1.log.error('Failed to retrieve user organizations', { error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve organizations');
    }
};
exports.getUserOrganizations = getUserOrganizations;
const getOrganizationById = async (orgId) => {
    validateOrgId(orgId);
    try {
        const userId = await getCurrentUserId();
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM get_organization_by_id($1, $2)', [orgId, userId]);
        if (!result.rows || result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        if (!row.org_id || !row.org_name || !row.slug || !row.org_status) {
            logger_1.log.error('Missing required fields in organization', { orgId });
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Organization data corrupted');
        }
        if (!(0, regexValidator_1.isValidUUID)(row.org_id)) {
            logger_1.log.error('Invalid UUID format', { orgId: row.org_id });
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Invalid organization data');
        }
        return {
            org_id: row.org_id,
            org_name: String(row.org_name),
            org_description: row.org_description ? String(row.org_description) : null,
            slug: String(row.slug),
            org_status: String(row.org_status),
            created_at: new Date(row.created_at),
            created_by: String(row.created_by),
            user_role: row.user_role ? String(row.user_role) : undefined
        };
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'You do not have permission to view this organization');
        }
        throw error;
    }
};
exports.getOrganizationById = getOrganizationById;
// ==================== UPDATE ====================
const updateOrganization = async (orgId, name, description, slug) => {
    validateOrgId(orgId);
    if (name) {
        if (!(0, regexValidator_1.isValidName)(name, 2, 100))
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_NAME);
        if ((0, regexValidator_1.containsDangerousChars)(name))
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED);
    }
    if (slug) {
        if (!(0, regexValidator_1.isValidSlug)(slug, 3, 50))
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_SLUG);
        if ((0, regexValidator_1.containsDangerousChars)(slug))
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED);
    }
    if (description) {
        if (description.length > 1000)
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED);
        if ((0, regexValidator_1.containsDangerousChars)(description))
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_FAILED);
    }
    const trimmedName = name ? name.trim() : null;
    const trimmedSlug = slug ? slug.toLowerCase().trim() : null;
    const trimmedDescription = description ? description.trim().substring(0, 1000) : null;
    const client = await tenantPool_1.tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT update_organization($1, $2, $3, $4, NULL)', [orgId, trimmedName, trimmedDescription, trimmedSlug]);
        await client.query('COMMIT');
        logger_1.log.info('Organization updated', { orgId });
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error.message.includes('permission')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED);
        }
        if (error.message.includes('slug already exists')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_SLUG_TAKEN);
        }
        logger_1.log.error('Failed to update organization', { orgId, error });
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateOrganization = updateOrganization;
// ==================== DELETE ====================
const deleteOrganization = async (orgId) => {
    validateOrgId(orgId);
    const client = await tenantPool_1.tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT soft_delete_organization($1)', [orgId]);
        await client.query('COMMIT');
        logger_1.log.info('Organization deleted', { orgId });
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error.message?.includes('already deleted') || error.message?.includes('not found')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_NOT_FOUND, 'Organization not found');
        }
        if (error.message.includes('only owner')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_OWNER_REQUIRED);
        }
        if (error.message.includes('has sites')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Cannot delete organization with active sites');
        }
        logger_1.log.error('Failed to delete organization', { orgId, error });
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteOrganization = deleteOrganization;
// ==================== INVITE ====================
const inviteToOrganization = async (orgId, friendshipCode, role) => {
    validateOrgId(orgId);
    validateFriendshipCode(friendshipCode);
    validateRole(role);
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT invite_to_organization($1, $2, $3) as invitation_id', [orgId, friendshipCode, role]);
        if (!result.rows[0]?.invitation_id) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to send invitation');
        }
        logger_1.log.info('Invitation sent', { orgId, role });
        return result.rows[0].invitation_id;
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can invite members');
        }
        if (error.message.includes('already a member')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_USER_ALREADY_MEMBER, 'User is already a member of this organization');
        }
        if (error.message.includes('not found') || error.message.includes('invalid')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invalid friendship code or user not found');
        }
        logger_1.log.error('Failed to send invitation', { orgId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to send invitation');
    }
};
exports.inviteToOrganization = inviteToOrganization;
// ==================== MEMBERS ====================
const getOrganizationMembers = async (orgId) => {
    validateOrgId(orgId);
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM get_organization_members($1)', [orgId]);
        if (!result.rows || result.rows.length === 0) {
            logger_1.log.debug('No members found for organization', { orgId });
            return [];
        }
        const members = result.rows.map((row, index) => {
            if (!row.user_id || !row.user_name || !row.user_email || !row.role) {
                logger_1.log.error('Missing required fields in member row', {
                    rowIndex: index,
                    orgId,
                    row: { user_id: row.user_id, user_name: row.user_name }
                });
                throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, `Member data corrupted at row ${index}`);
            }
            if (!(0, regexValidator_1.isValidUUID)(row.user_id)) {
                logger_1.log.error('Invalid UUID format in member row', {
                    rowIndex: index,
                    userId: row.user_id
                });
                throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, `Invalid user ID format at row ${index}`);
            }
            if (!(0, regexValidator_1.isValidEmail)(row.user_email)) {
                logger_1.log.warn('Invalid email format in member row', {
                    rowIndex: index,
                    email: row.user_email
                });
            }
            return {
                user_id: String(row.user_id),
                user_name: String(row.user_name),
                user_email: String(row.user_email),
                role: String(row.role),
                joined_at: new Date(row.joined_at),
                invited_by: row.invited_by ? String(row.invited_by) : ''
            };
        });
        logger_1.log.info(`Retrieved ${members.length} members for organization`, { orgId });
        return members;
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner and admin can view members');
        }
        logger_1.log.error('Failed to retrieve organization members', { orgId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve organization members');
    }
};
exports.getOrganizationMembers = getOrganizationMembers;
const updateMemberRole = async (orgId, memberId, role) => {
    validateOrgId(orgId);
    if (!(0, regexValidator_1.isValidUUID)(memberId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    validateRole(role);
    try {
        await tenantPool_1.tenantPool.query('SELECT update_member_role($1, $2, $3)', [orgId, memberId, role]);
        logger_1.log.info('Member role updated', { orgId, memberId, role });
    }
    catch (error) {
        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can update member roles');
        }
        if (error.message.includes('cannot change your own')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Cannot change your own role');
        }
        logger_1.log.error('Failed to update member role', { orgId, memberId, role, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to update member role');
    }
};
exports.updateMemberRole = updateMemberRole;
const removeMember = async (orgId, memberId) => {
    validateOrgId(orgId);
    if (!(0, regexValidator_1.isValidUUID)(memberId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool_1.tenantPool.query('SELECT remove_member($1, $2)', [orgId, memberId]);
        logger_1.log.info('Member removed', { orgId, memberId });
    }
    catch (error) {
        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can remove members');
        }
        if (error.message.includes('cannot remove yourself')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Cannot remove yourself. Use leave endpoint instead.');
        }
        if (error.message.includes('last owner')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_OWNER_REQUIRED, 'Cannot remove the last owner of organization');
        }
        logger_1.log.error('Failed to remove member', { orgId, memberId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to remove member');
    }
};
exports.removeMember = removeMember;
// ==================== INVITATIONS ====================
const getPendingInvitations = async (orgId) => {
    validateOrgId(orgId);
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM get_pending_invitations($1)', [orgId]);
        return result.rows;
    }
    catch (error) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can view invitations');
        }
        throw error;
    }
};
exports.getPendingInvitations = getPendingInvitations;
const getInvitationOrgId = async (invitationId) => {
    // Şu an invitation sistemi henüz tam implemente edilmedi
    // İleride invitations tablosu eklendiğinde buradan org_id çekilecek
    // Şimdilik null dönerek controller'da hata verdirelim
    return null;
};
exports.getInvitationOrgId = getInvitationOrgId;
// organization.service.ts içinde zaten varsa dokunma, yoksa ekle:
const cancelInvitation = async (invitationId) => {
    if (!(0, regexValidator_1.isValidUUID)(invitationId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool_1.tenantPool.query('SELECT cancel_invitation($1)', [invitationId]);
        logger_1.log.info('Invitation cancelled', { invitationId });
    }
    catch (error) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can cancel invitations');
        }
        throw error;
    }
};
exports.cancelInvitation = cancelInvitation;
// ==================== STATS ====================
const getOrganizationStats = async (orgId) => {
    validateOrgId(orgId);
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT * FROM get_organization_stats($1)', [orgId]);
        return result.rows[0] || null;
    }
    catch (error) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'You do not have permission to view organization stats');
        }
        throw error;
    }
};
exports.getOrganizationStats = getOrganizationStats;
// ==================== LEAVE ====================
const leaveOrganization = async (orgId) => {
    validateOrgId(orgId);
    try {
        await tenantPool_1.tenantPool.query('SELECT leave_organization($1)', [orgId]);
        logger_1.log.info('User left organization', { orgId });
    }
    catch (error) {
        if (error.message.includes('last owner') || error.message.includes('cannot leave')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_OWNER_REQUIRED, 'Cannot leave organization as the last owner. Transfer ownership first.');
        }
        logger_1.log.error('Failed to leave organization', { orgId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to leave organization');
    }
};
exports.leaveOrganization = leaveOrganization;
//# sourceMappingURL=organization.service.js.map