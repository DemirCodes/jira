/**
 * ORGANIZATION SERVICE
 * 
 * Tüm validasyonlar regexValidator.ts üzerinden yapılır
 */

import { tenantPool } from '../db/tenantPool';
import { 
    isValidSlug,
    isValidName,
    isValidUUID,
    isValidEmail,
    sanitizeInput,
    containsDangerousChars,
    containsSqlPatterns
} from '../utils/regexValidator';
import { log } from '../utils/logger';

// ==================== TYPES ====================
export interface Organization {
    org_id: string;
    org_name: string;
    org_description: string | null;
    slug: string;
    org_status: string;
    created_at: Date;
    created_by: string;
    member_count?: number;
    user_role?: string;
}

export interface OrganizationMember {
    user_id: string;
    user_name: string;
    user_email: string;
    role: string;
    joined_at: Date;
    invited_by: string;
}

export interface OrganizationInvitation {
    invitation_id: string;
    organization_id: string;
    invited_user_id: string;
    invited_by_user_id: string;
    role: string;
    status: string;
    created_at: Date;
    expires_at: Date;
}

// ==================== VALIDATION HELPERS ====================

const validateOrgInput = (name: string, slug: string): void => {
    // Name validasyonu
    if (!isValidName(name, 2, 100)) {
        throw new Error('Invalid organization name. Must be 2-100 characters and contain only letters, spaces, dots and hyphens');
    }
    
    // Slug validasyonu
    if (!isValidSlug(slug, 3, 50)) {
        throw new Error('Invalid slug. Must be 3-50 characters and contain only lowercase letters, numbers and hyphens');
    }
    
    // XSS kontrolü
    if (containsDangerousChars(name) || containsDangerousChars(slug)) {
        throw new Error('Invalid characters detected in input');
    }
    
    // SQL injection kontrolü
    if (containsSqlPatterns(name) || containsSqlPatterns(slug)) {
        throw new Error('Invalid patterns detected in input');
    }
};

const validateUserId = (userId: string): void => {
    if (!isValidUUID(userId)) {
        throw new Error('Invalid user ID format');
    }
};

const validateOrgId = (orgId: string): void => {
    if (!isValidUUID(orgId)) {
        throw new Error('Invalid organization ID format');
    }
};

const validateFriendshipCode = (code: string): void => {
    if (!code || code.length < 6 || code.length > 50) {
        throw new Error('Invalid friendship code format');
    }
    if (containsDangerousChars(code)) {
        throw new Error('Invalid characters in friendship code');
    }
};

const validateRole = (role: string): void => {
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
};

// ==================== CREATE ====================
export const createOrganization = async (
    userId: string,
    name: string,
    slug: string,
    description?: string
): Promise<string> => {
    // Validasyonlar
    validateUserId(userId);
    validateOrgInput(name, slug);
    
    // Description validasyonu (varsa)
    if (description) {
        if (description.length > 1000) {
            throw new Error('Description cannot exceed 1000 characters');
        }
        if (containsDangerousChars(description)) {
            throw new Error('Invalid characters in description');
        }
    }
    
    // Input sanitize
    const sanitizedName = sanitizeInput(name);
    const sanitizedSlug = slug.toLowerCase().trim();
    const sanitizedDescription = description ? sanitizeInput(description).substring(0, 1000) : null;
    
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'SELECT create_organization($1, $2, $3, $4) as org_id',
            [userId, sanitizedName, sanitizedSlug, sanitizedDescription]
        );
        
        await client.query('COMMIT');
        
        if (!result.rows[0]?.org_id) {
            throw new Error('Failed to create organization');
        }
        
        return result.rows[0].org_id;
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.message.includes('already exists') || error.code === '23505') {
            throw new Error('Slug already exists');
        }
        throw error;
    } finally {
        client.release();
    }
};

// ==================== READ ====================
export const getUserOrganizations = async (userId: string): Promise<Organization[]> => {
    validateUserId(userId);
    
    // Fonksiyon çağrısı yerine direkt sorgu (geçici çözüm)
    const result = await tenantPool.query(
        `SELECT o.org_id, o.org_name, o.org_description, o.slug, o.org_status, 
                o.created_at, o.created_by, om.role as user_role
         FROM organizations o
         JOIN organization_memberships om ON om.org_id = o.org_id
         WHERE om.user_id = $1 AND om.deleted_at IS NULL AND o.deleted_at IS NULL
         ORDER BY o.created_at DESC`,
        [userId]
    );
    return result.rows;
};


export const getOrganizationById = async (userId: string, orgId: string): Promise<Organization | null> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    // Yetki kontrolü: Kullanıcı bu organization'a üye mi?
    const accessCheck = await tenantPool.query(
        'SELECT 1 FROM organization_memberships WHERE org_id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [orgId, userId]
    );
    
    if (accessCheck.rows.length === 0) {
        throw new Error('PERMISSION_DENIED');
    }
    
    const result = await tenantPool.query(
        'SELECT * FROM get_organization_by_id($1)',
        [orgId]
    );
    
    return result.rows[0] || null;
};

// ==================== UPDATE ====================
export const updateOrganization = async (
    userId: string,
    orgId: string,
    name?: string,
    description?: string,
    slug?: string
): Promise<Organization> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    // Name validasyonu
    if (name) {
        if (!isValidName(name, 2, 100)) {
            throw new Error('Invalid organization name');
        }
        if (containsDangerousChars(name)) {
            throw new Error('Invalid characters in name');
        }
    }
    
    // Slug validasyonu
    if (slug) {
        if (!isValidSlug(slug, 3, 50)) {
            throw new Error('Invalid slug format');
        }
        if (containsDangerousChars(slug)) {
            throw new Error('Invalid characters in slug');
        }
    }
    
    // Description validasyonu
    if (description) {
        if (description.length > 1000) {
            throw new Error('Description cannot exceed 1000 characters');
        }
        if (containsDangerousChars(description)) {
            throw new Error('Invalid characters in description');
        }
    }
    
    // Sanitize
    const sanitizedName = name ? sanitizeInput(name) : null;
    const sanitizedSlug = slug ? slug.toLowerCase().trim() : null;
    const sanitizedDescription = description ? sanitizeInput(description).substring(0, 1000) : null;
    
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'SELECT update_organization($1, $2, $3, $4, $5) as org',
            [orgId, sanitizedName, sanitizedDescription, sanitizedSlug, userId]
        );
        
        await client.query('COMMIT');
        
        if (!result.rows[0]?.org) {
            throw new Error('Organization not found or update failed');
        }
        
        return result.rows[0].org;
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.message.includes('permission')) {
            throw new Error('Permission denied');
        }
        if (error.message.includes('slug already exists')) {
            throw new Error('Slug already exists');
        }
        throw error;
    } finally {
        client.release();
    }
};

// ==================== DELETE ====================
export const deleteOrganization = async (
    userId: string,
    orgId: string
): Promise<void> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'SELECT delete_organization($1, $2)',
            [orgId, userId]
        );
        
        await client.query('COMMIT');
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.message.includes('permission')) {
            throw new Error('Permission denied');
        }
        if (error.message.includes('last owner')) {
            throw new Error('Cannot delete the last owner');
        }
        throw error;
    } finally {
        client.release();
    }
};

// ==================== INVITE ====================
export const inviteToOrganization = async (
    userId: string,
    orgId: string,
    friendshipCode: string,
    role: string
): Promise<string> => {
    validateUserId(userId);
    validateOrgId(orgId);
    validateFriendshipCode(friendshipCode);
    validateRole(role);
    
    const result = await tenantPool.query(
        'SELECT invite_to_organization($1, $2, $3, $4) as invitation_id',
        [userId, orgId, friendshipCode, role]
    );
    
    if (!result.rows[0]?.invitation_id) {
        throw new Error('Failed to send invitation');
    }
    
    return result.rows[0].invitation_id;
};

// ==================== MEMBERS ====================
export const getOrganizationMembers = async (
    userId: string,
    orgId: string
): Promise<OrganizationMember[]> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    const result = await tenantPool.query(
        'SELECT * FROM get_organization_members($1, $2)',
        [orgId, userId]
    );
    return result.rows;
};

export const updateMemberRole = async (
    userId: string,
    orgId: string,
    memberId: string,
    role: string
): Promise<void> => {
    validateUserId(userId);
    validateOrgId(orgId);
    validateUserId(memberId);
    validateRole(role);
    
    // Kendi rolünü değiştirmeye çalışıyorsa kontrol
    if (userId === memberId) {
        throw new Error('Cannot change your own role');
    }
    
    await tenantPool.query(
        'SELECT update_member_role($1, $2, $3, $4)',
        [orgId, memberId, role, userId]
    );
};

export const removeMember = async (
    userId: string,
    orgId: string,
    memberId: string
): Promise<void> => {
    validateUserId(userId);
    validateOrgId(orgId);
    validateUserId(memberId);
    
    // Kendini çıkarmaya çalışıyorsa leave endpoint'ini kullan
    if (userId === memberId) {
        throw new Error('Use leave endpoint to remove yourself');
    }
    
    await tenantPool.query(
        'SELECT remove_member($1, $2, $3)',
        [orgId, memberId, userId]
    );
};

// ==================== INVITATIONS ====================
export const getPendingInvitations = async (
    userId: string,
    orgId: string
): Promise<OrganizationInvitation[]> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    const result = await tenantPool.query(
        'SELECT * FROM get_pending_invitations($1, $2)',
        [orgId, userId]
    );
    return result.rows;
};

export const cancelInvitation = async (
    userId: string,
    invitationId: string
): Promise<void> => {
    validateUserId(userId);
    
    if (!isValidUUID(invitationId)) {
        throw new Error('Invalid invitation ID format');
    }
    
    await tenantPool.query(
        'SELECT cancel_invitation($1, $2)',
        [invitationId, userId]
    );
};

// ==================== STATS ====================
export const getOrganizationStats = async (
    userId: string,
    orgId: string
): Promise<any> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    const result = await tenantPool.query(
        'SELECT * FROM get_organization_stats($1, $2)',
        [orgId, userId]
    );
    return result.rows[0];
};

// ==================== LEAVE ====================
export const leaveOrganization = async (
    userId: string,
    orgId: string
): Promise<void> => {
    validateUserId(userId);
    validateOrgId(orgId);
    
    await tenantPool.query(
        'SELECT leave_organization($1, $2)',
        [orgId, userId]
    );
};