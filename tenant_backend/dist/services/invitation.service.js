"use strict";
/**
 * INVITATION SERVICE
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingInvitationsForOrg = exports.getPendingInvitationsForUser = exports.cancelInvitation = exports.rejectInvitation = exports.acceptInvitation = exports.createInvitation = void 0;
const tenantPool_1 = require("../db/tenantPool");
const regexValidator_1 = require("../utils/regexValidator");
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
// ==================== CREATE ====================
const createInvitation = async (orgId, friendshipCode, entityType, role, entityId) => {
    if (!(0, regexValidator_1.isValidUUID)(orgId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    if (!(0, regexValidator_1.isValidUUID)(friendshipCode))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        const result = await tenantPool_1.tenantPool.query('SELECT create_invitation($1, $2, $3, $4, $5) as invitation_id', [orgId, friendshipCode, entityType, entityId || null, role]);
        if (!result.rows[0]?.invitation_id) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create invitation');
        }
        logger_1.log.info('Invitation created', { invitationId: result.rows[0].invitation_id, entityType, orgId });
        return result.rows[0].invitation_id;
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError)
            throw error;
        if (error.message?.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only organization owner or admin can send invitations');
        }
        if (error.message?.includes('already a member') || error.message?.includes('already exists')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_USER_ALREADY_MEMBER, 'User is already a member');
        }
        if (error.message?.includes('not found') || error.message?.includes('Invalid friendship')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invalid friendship code or user not found');
        }
        logger_1.log.error('Failed to create invitation', { orgId, entityType, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to create invitation');
    }
};
exports.createInvitation = createInvitation;
// ==================== ACCEPT ====================
const acceptInvitation = async (invitationId) => {
    if (!(0, regexValidator_1.isValidUUID)(invitationId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool_1.tenantPool.query('SELECT accept_invitation($1)', [invitationId]);
        logger_1.log.info('Invitation accepted', { invitationId });
    }
    catch (error) {
        if (error.message?.includes('not for you')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'This invitation is not for you');
        }
        if (error.message?.includes('already')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
        }
        if (error.message?.includes('expired')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_INVALID_INVITE_CODE, 'Invitation has expired');
        }
        throw error;
    }
};
exports.acceptInvitation = acceptInvitation;
// ==================== REJECT ====================
const rejectInvitation = async (invitationId) => {
    if (!(0, regexValidator_1.isValidUUID)(invitationId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool_1.tenantPool.query('SELECT reject_invitation($1)', [invitationId]);
        logger_1.log.info('Invitation rejected', { invitationId });
    }
    catch (error) {
        if (error.message?.includes('not for you')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'This invitation is not for you');
        }
        if (error.message?.includes('already')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
        }
        throw error;
    }
};
exports.rejectInvitation = rejectInvitation;
// ==================== CANCEL ====================
const cancelInvitation = async (invitationId) => {
    if (!(0, regexValidator_1.isValidUUID)(invitationId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        await tenantPool_1.tenantPool.query('SELECT cancel_invitation($1)', [invitationId]);
        logger_1.log.info('Invitation cancelled', { invitationId });
    }
    catch (error) {
        if (error.message?.includes('PERMISSION_DENIED')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Only invitation creator or org admin/owner can cancel');
        }
        if (error.message?.includes('already')) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.ORG_ALREADY_EXISTS, 'Invitation is already processed');
        }
        throw error;
    }
};
exports.cancelInvitation = cancelInvitation;
// ==================== READ ====================
const getPendingInvitationsForUser = async () => {
    try {
        const result = await tenantPool_1.tenantPool.query(`SELECT i.*, o.org_name, 
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
             ORDER BY i.created_at DESC`);
        return result.rows;
    }
    catch (error) {
        logger_1.log.error('Failed to get pending invitations', { error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve invitations');
    }
};
exports.getPendingInvitationsForUser = getPendingInvitationsForUser;
const getPendingInvitationsForOrg = async (orgId) => {
    if (!(0, regexValidator_1.isValidUUID)(orgId))
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
    try {
        const result = await tenantPool_1.tenantPool.query(`SELECT i.*, o.org_name,
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
             ORDER BY i.created_at DESC`, [orgId]);
        return result.rows;
    }
    catch (error) {
        logger_1.log.error('Failed to get pending invitations for org', { orgId, error });
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve invitations');
    }
};
exports.getPendingInvitationsForOrg = getPendingInvitationsForOrg;
//# sourceMappingURL=invitation.service.js.map