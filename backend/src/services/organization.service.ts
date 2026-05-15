/**
 * ORGANIZATION SERVICE
 * 
 * Tüm yetkilendirme auth_current_user_id() ile DB katmanında yapılır.
 * Servis sadece validasyon, tip kontrolü ve veri dönüşümünden sorumludur.
 */

import { tenantPool } from '../db/tenantPool';
import {
    isValidSlug,
    isValidName,
    isValidUUID,
    isValidEmail,
    containsDangerousChars,
    containsSqlPatterns
} from '../utils/regexValidator';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import {
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    OrganizationStats
} from '../types/organization.types';

// ==================== YARDIMCI ====================

const getCurrentUserId = async (): Promise<string> => {
    const result = await tenantPool.query(
        'SELECT current_setting($1, true) as user_id',
        ['app.current_user_id']
    );
    const userId = result.rows[0]?.user_id;
    if (!userId) throw new AppError(ErrorCodes.AUTH_NO_TOKEN, 'User not authenticated');
    return userId;
};

// ==================== VALIDATION HELPERS ====================

const validateOrgInput = (name: string, slug: string): void => {
    if (!isValidName(name, 2, 100)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME,
            'Invalid organization name. Must be 2-100 characters and contain only letters, spaces, dots and hyphens');
    }
    if (!isValidSlug(slug, 3, 50)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG,
            'Invalid slug. Must be 3-50 characters and contain only lowercase letters, numbers and hyphens');
    }
    if (containsDangerousChars(name) || containsDangerousChars(slug)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected in input');
    }
    if (containsSqlPatterns(name) || containsSqlPatterns(slug)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid patterns detected in input');
    }
};

const validateOrgId = (orgId: string): void => {
    if (!isValidUUID(orgId)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
    }
};

const validateFriendshipCode = (code: string): void => {
    if (!isValidUUID(code)) {
        throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid friendship code format');
    }
};

const validateRole = (role: string): void => {
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED,
            `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
};

// ==================== CREATE ====================
export const createOrganization = async (
    userId: string,
    name: string,
    slug: string,
    description?: string
): Promise<string> => {
    validateOrgInput(name, slug);

    if (description) {
        if (description.length > 1000) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Description cannot exceed 1000 characters');
        }
        if (containsDangerousChars(description)) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in description');
        }
    }

    const trimmedName = name.trim();
    const trimmedSlug = slug.toLowerCase().trim();
    const trimmedDescription = description ? description.trim().substring(0, 1000) : null;

    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            'SELECT create_organization($1, $2, $3, $4) as org_id',
            [userId, trimmedName, trimmedSlug, trimmedDescription]
        );

        await client.query('COMMIT');

        if (!result.rows[0]?.org_id) {
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create organization');
        }

        log.info('Organization created', { orgId: result.rows[0].org_id, slug: trimmedSlug });
        return result.rows[0].org_id;
    } catch (error: any) {
        await client.query('ROLLBACK');

        // AppError ise direkt fırlat
        if (error instanceof AppError) throw error;

        // DB hatalarını yakala
        if (error.message?.includes('already exists') || error.code === '23505') {
            throw new AppError(ErrorCodes.ORG_SLUG_TAKEN, 'Slug already exists');
        }
        if (error.message?.includes('limit reached')) {
            throw new AppError(ErrorCodes.ORG_LIMIT_REACHED, 'Organization creation limit reached');
        }
        if (error.message?.includes('not found') || error.message?.includes('inactive')) {
            throw new AppError(ErrorCodes.AUTH_USER_NOT_FOUND, 'User not found or inactive');
        }

        log.error('Failed to create organization', { slug: trimmedSlug, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create organization');
    } finally {
        client.release();
    }
};

// ==================== READ ====================
export const getUserOrganizations = async (): Promise<Organization[]> => {
    try {
        const result = await tenantPool.query('SELECT * FROM get_user_organizations()');

        if (!result.rows || result.rows.length === 0) {
            log.debug('No organizations found for user');
            return [];
        }

        const organizations: Organization[] = result.rows.map((row, index) => {
            if (!row.org_id || !row.org_name || !row.slug || !row.org_status) {
                log.error('Missing required fields in organization row', {
                    rowIndex: index,
                    row: { org_id: row.org_id, org_name: row.org_name }
                });
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, `Organization data corrupted at row ${index}`);
            }

            if (!isValidUUID(row.org_id) || (row.created_by && !isValidUUID(row.created_by))) {
                log.error('Invalid UUID format in organization row', {
                    rowIndex: index,
                    org_id: row.org_id,
                    created_by: row.created_by
                });
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, `Invalid UUID format at row ${index}`);
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

        log.info(`Retrieved ${organizations.length} organizations`);
        return organizations;
    } catch (error) {
        if (error instanceof AppError) throw error;
        log.error('Failed to retrieve user organizations', { error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve organizations');
    }
};

export const getOrganizationById = async (orgId: string): Promise<Organization | null> => {
    validateOrgId(orgId);

    try {
        const userId = await getCurrentUserId();

        const result = await tenantPool.query(
            'SELECT * FROM get_organization_by_id($1, $2)',
            [orgId, userId]
        );

        if (!result.rows || result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        if (!row.org_id || !row.org_name || !row.slug || !row.org_status) {
            log.error('Missing required fields in organization', { orgId });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Organization data corrupted');
        }

        if (!isValidUUID(row.org_id)) {
            log.error('Invalid UUID format', { orgId: row.org_id });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Invalid organization data');
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
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'You do not have permission to view this organization');
        }
        throw error;
    }
};

// ==================== UPDATE ====================
export const updateOrganization = async (
    orgId: string,
    name?: string,
    description?: string,
    slug?: string
): Promise<void> => {
    validateOrgId(orgId);

    if (name) {
        if (!isValidName(name, 2, 100)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
        if (containsDangerousChars(name)) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }
    if (slug) {
        if (!isValidSlug(slug, 3, 50)) throw new AppError(ErrorCodes.VALIDATION_INVALID_SLUG);
        if (containsDangerousChars(slug)) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }
    if (description) {
        if (description.length > 1000) throw new AppError(ErrorCodes.VALIDATION_FAILED);
        if (containsDangerousChars(description)) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    const trimmedName = name ? name.trim() : null;
    const trimmedSlug = slug ? slug.toLowerCase().trim() : null;
    const trimmedDescription = description ? description.trim().substring(0, 1000) : null;

    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'SELECT update_organization($1, $2, $3, $4, NULL)',
            [orgId, trimmedName, trimmedDescription, trimmedSlug]
        );
        await client.query('COMMIT');
        log.info('Organization updated', { orgId });
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.message.includes('permission')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED);
        }
        if (error.message.includes('slug already exists')) {
            throw new AppError(ErrorCodes.ORG_SLUG_TAKEN);
        }
        log.error('Failed to update organization', { orgId, error });
        throw error;
    } finally {
        client.release();
    }
};

// ==================== DELETE ====================
export const deleteOrganization = async (orgId: string): Promise<void> => {
    validateOrgId(orgId);

    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT soft_delete_organization($1)', [orgId]);
        await client.query('COMMIT');
        log.info('Organization deleted', { orgId });
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.message?.includes('already deleted') || error.message?.includes('not found')) {
            throw new AppError(ErrorCodes.ORG_NOT_FOUND, 'Organization not found');
        }
        if (error.message.includes('only owner')) {
            throw new AppError(ErrorCodes.ORG_OWNER_REQUIRED);
        }
        if (error.message.includes('has sites')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'Cannot delete organization with active sites');
        }
        log.error('Failed to delete organization', { orgId, error });
        throw error;
    } finally {
        client.release();
    }
};

// ==================== INVITE ====================
export const inviteToOrganization = async (
    orgId: string,
    friendshipCode: string,
    role: string
): Promise<string> => {
    validateOrgId(orgId);
    validateFriendshipCode(friendshipCode);
    validateRole(role);

    try {
        const result = await tenantPool.query(
            'SELECT invite_to_organization($1, $2, $3) as invitation_id',
            [orgId, friendshipCode, role]
        );

        if (!result.rows[0]?.invitation_id) {
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to send invitation');
        }

        log.info('Invitation sent', { orgId, role });
        return result.rows[0].invitation_id;
    } catch (error: any) {
        if (error instanceof AppError) throw error;

        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can invite members');
        }
        if (error.message.includes('already a member')) {
            throw new AppError(ErrorCodes.ORG_USER_ALREADY_MEMBER, 'User is already a member of this organization');
        }
        if (error.message.includes('not found') || error.message.includes('invalid')) {
            throw new AppError(ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invalid friendship code or user not found');
        }
        log.error('Failed to send invitation', { orgId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to send invitation');
    }
};

// ==================== MEMBERS ====================
export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
    validateOrgId(orgId);

    try {
        const result = await tenantPool.query(
            'SELECT * FROM get_organization_members($1)',
            [orgId]
        );

        if (!result.rows || result.rows.length === 0) {
            log.debug('No members found for organization', { orgId });
            return [];
        }

        const members: OrganizationMember[] = result.rows.map((row, index) => {
            if (!row.user_id || !row.user_name || !row.user_email || !row.role) {
                log.error('Missing required fields in member row', {
                    rowIndex: index,
                    orgId,
                    row: { user_id: row.user_id, user_name: row.user_name }
                });
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, `Member data corrupted at row ${index}`);
            }

            if (!isValidUUID(row.user_id)) {
                log.error('Invalid UUID format in member row', {
                    rowIndex: index,
                    userId: row.user_id
                });
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, `Invalid user ID format at row ${index}`);
            }

            if (!isValidEmail(row.user_email)) {
                log.warn('Invalid email format in member row', {
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

        log.info(`Retrieved ${members.length} members for organization`, { orgId });
        return members;
    } catch (error: any) {
        if (error instanceof AppError) throw error;

        if (error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Only organization owner and admin can view members');
        }

        log.error('Failed to retrieve organization members', { orgId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve organization members');
    }
};

export const updateMemberRole = async (
    orgId: string,
    memberId: string,
    role: string
): Promise<void> => {
    validateOrgId(orgId);
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    validateRole(role);

    try {
        await tenantPool.query('SELECT update_member_role($1, $2, $3)', [orgId, memberId, role]);
        log.info('Member role updated', { orgId, memberId, role });
    } catch (error: any) {
        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Only organization owner or admin can update member roles');
        }
        if (error.message.includes('cannot change your own')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'Cannot change your own role');
        }
        log.error('Failed to update member role', { orgId, memberId, role, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update member role');
    }
};

export const removeMember = async (orgId: string, memberId: string): Promise<void> => {
    validateOrgId(orgId);
    if (!isValidUUID(memberId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    try {
        await tenantPool.query('SELECT remove_member($1, $2)', [orgId, memberId]);
        log.info('Member removed', { orgId, memberId });
    } catch (error: any) {
        if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Only organization owner or admin can remove members');
        }
        if (error.message.includes('cannot remove yourself')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Cannot remove yourself. Use leave endpoint instead.');
        }
        if (error.message.includes('last owner')) {
            throw new AppError(ErrorCodes.ORG_OWNER_REQUIRED,
                'Cannot remove the last owner of organization');
        }
        log.error('Failed to remove member', { orgId, memberId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to remove member');
    }
};

// ==================== INVITATIONS ====================
export const getPendingInvitations = async (orgId: string): Promise<OrganizationInvitation[]> => {
    validateOrgId(orgId);
    try {
        const result = await tenantPool.query('SELECT * FROM get_pending_invitations($1)', [orgId]);
        return result.rows;
    } catch (error: any) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Only organization owner or admin can view invitations');
        }
        throw error;
    }
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
    if (!isValidUUID(invitationId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool.query('SELECT cancel_invitation($1)', [invitationId]);
        log.info('Invitation cancelled', { invitationId });
    } catch (error: any) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'Only organization owner or admin can cancel invitations');
        }
        throw error;
    }
};

// ==================== STATS ====================
export const getOrganizationStats = async (orgId: string): Promise<OrganizationStats | null> => {
    validateOrgId(orgId);
    try {
        const result = await tenantPool.query('SELECT * FROM get_organization_stats($1)', [orgId]);
        return result.rows[0] || null;
    } catch (error: any) {
        if (error.message.includes('PERMISSION_DENIED')) {
            throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED,
                'You do not have permission to view organization stats');
        }
        throw error;
    }
};

// ==================== LEAVE ====================
export const leaveOrganization = async (orgId: string): Promise<void> => {
    validateOrgId(orgId);

    try {
        await tenantPool.query('SELECT leave_organization($1)', [orgId]);
        log.info('User left organization', { orgId });
    } catch (error: any) {
        if (error.message.includes('last owner') || error.message.includes('cannot leave')) {
            throw new AppError(ErrorCodes.ORG_OWNER_REQUIRED,
                'Cannot leave organization as the last owner. Transfer ownership first.');
        }
        log.error('Failed to leave organization', { orgId, error });
        throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to leave organization');
    }
};