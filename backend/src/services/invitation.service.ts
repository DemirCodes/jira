/**
 * INVITATION SERVICE (SECURED WITH RLS WRAPPER)
 */

import { tenantPool } from '../db/tenantPool';
import { PoolClient } from 'pg';
import { isValidUUID } from '../utils/regexValidator';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { Invitation, InvitationWithDetails } from '../types/invitation.types';

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

// ==================== CREATE ====================
export const createInvitation = async (
    orgId: string,
    friendshipCode: string,
    entityType: 'organization' | 'site' | 'project' | 'issue',
    role: string,
    entityId: string | undefined, // Controller'dan undefined gelebilir
    userId: string                // RLS Context için zorunlu
): Promise<string> => {
    if (!isValidUUID(orgId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    if (!isValidUUID(friendshipCode)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT create_invitation($1, $2, $3, $4, $5) as invitation_id',
                [orgId, friendshipCode, entityType, entityId || null, role]
            );

            if (!result.rows[0]?.invitation_id) {
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create invitation');
            }

            log.info('Invitation created', { invitationId: result.rows[0].invitation_id, entityType, orgId });
            return result.rows[0].invitation_id;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error.message?.includes('PERMISSION_DENIED')) {
                throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can send invitations');
            }
            if (error.message?.includes('already a member') || error.message?.includes('already exists')) {
                throw new AppError(ErrorCodes.ORG_USER_ALREADY_MEMBER, 'User is already a member');
            }
            if (error.message?.includes('not found') || error.message?.includes('Invalid friendship')) {
                throw new AppError(ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invalid friendship code or user not found');
            }
            log.error('Failed to create invitation', { orgId, entityType, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create invitation');
        }
    });
};

// ==================== ACCEPT ====================
export const acceptInvitation = async (invitationId: string, userId: string): Promise<void> => {
    if (!isValidUUID(invitationId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT accept_invitation($1)', [invitationId]);
            log.info('Invitation accepted', { invitationId });
        } catch (error: any) {
            if (error.message?.includes('not for you')) {
                throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'This invitation is not for you');
            }
            if (error.message?.includes('already')) {
                throw new AppError(ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
            }
            if (error.message?.includes('expired')) {
                throw new AppError(ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invitation has expired');
            }
            throw error;
        }
    });
};

// ==================== REJECT ====================
export const rejectInvitation = async (invitationId: string, userId: string): Promise<void> => {
    if (!isValidUUID(invitationId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT reject_invitation($1)', [invitationId]);
            log.info('Invitation rejected', { invitationId });
        } catch (error: any) {
            if (error.message?.includes('not for you')) {
                throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'This invitation is not for you');
            }
            if (error.message?.includes('already')) {
                throw new AppError(ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
            }
            throw error;
        }
    });
};

// ==================== CANCEL ====================
export const cancelInvitation = async (invitationId: string, userId: string): Promise<void> => {
    if (!isValidUUID(invitationId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT cancel_invitation($1)', [invitationId]);
            log.info('Invitation cancelled', { invitationId });
        } catch (error: any) {
            if (error.message?.includes('PERMISSION_DENIED')) {
                throw new AppError(ErrorCodes.ORG_PERMISSION_DENIED, 'Only invitation creator or org admin/owner can cancel');
            }
            if (error.message?.includes('already')) {
                throw new AppError(ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
            }
            throw error;
        }
    });
};

// ==================== READ ====================
export const getPendingInvitationsForUser = async (userId: string): Promise<InvitationWithDetails[]> => {
    return withRLS(userId, async (client) => {
        try {
            // auth_current_user_id() fonksiyonu withRLS sayesinde hatasız çalışacak
            const result = await client.query(
                `SELECT i.*, o.org_name, 
                        CONCAT(u1.user_name, ' ', u1.user_last_name) as invited_by_name,
                        CONCAT(u2.user_name, ' ', u2.user_last_name) as invited_user_name,
                        u2.user_email as invited_user_email
                 FROM invitations i
                 JOIN organizations o ON o.org_id = i.org_id
                 JOIN users u1 ON u1.user_id = i.invited_by
                 JOIN users u2 ON u2.user_id = i.invited_user_id
                 WHERE i.invited_user_id = auth_current_user_id()
                   AND i.status = 'pending'
                   AND i.deleted_at IS NULL
                 ORDER BY i.created_at DESC`
            );
            return result.rows;
        } catch (error) {
            log.error('Failed to get pending invitations', { error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve invitations');
        }
    });
};

export const getPendingInvitationsForOrg = async (orgId: string, userId: string): Promise<InvitationWithDetails[]> => {
    if (!isValidUUID(orgId)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `SELECT i.*, o.org_name,
                        CONCAT(u1.user_name, ' ', u1.user_last_name) as invited_by_name,
                        CONCAT(u2.user_name, ' ', u2.user_last_name) as invited_user_name,
                        u2.user_email as invited_user_email
                 FROM invitations i
                 JOIN organizations o ON o.org_id = i.org_id
                 JOIN users u1 ON u1.user_id = i.invited_by
                 JOIN users u2 ON u2.user_id = i.invited_user_id
                 WHERE i.org_id = $1
                   AND i.status = 'pending'
                   AND i.deleted_at IS NULL
                 ORDER BY i.created_at DESC`,
                [orgId]
            );
            return result.rows;
        } catch (error) {
            log.error('Failed to get pending invitations for org', { orgId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve invitations');
        }
    });
};