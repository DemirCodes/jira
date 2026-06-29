"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.leave = exports.getStats = exports.cancelInvitation = exports.listInvitations = exports.removeMember = exports.updateMemberRole = exports.listMembers = exports.invite = exports.remove = exports.update = exports.getById = exports.list = exports.create = void 0;
const orgService = __importStar(require("../services/organization.service"));
const authService = __importStar(require("../services/authorization.service"));
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
const regexValidator_1 = require("../utils/regexValidator");
const invitationService = __importStar(require("../services/invitation.service"));
/************ IMPORTS ***********/
// ==================== CREATE ====================
const create = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, slug, description } = req.body;
        if (!name || !slug) {
            res.status(400).json({ error: 'name and slug are required' });
            return;
        }
        // Create: authenticated user yeterli
        const orgId = await orgService.createOrganization(userId, name, slug, description);
        res.status(201).json({ org_id: orgId });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to create organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.create = create;
// ==================== READ ====================
const list = async (req, res) => {
    try {
        // listUserOrganizations DB fonksiyonu zaten sadece kullanıcının üye olduğu organizasyonları döner
        const orgs = await orgService.getUserOrganizations();
        res.json(orgs);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to list organizations', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.list = list;
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // UUID validasyonu - önce format kontrolü
        if (!(0, regexValidator_1.isValidUUID)(id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID format');
        }
        // Yetki kontrolü
        await authService.requireOrgMember(userId, id);
        const org = await orgService.getOrganizationById(id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        res.json(org);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to get organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getById = getById;
// ==================== UPDATE ====================
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { name, description, slug } = req.body;
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        await orgService.updateOrganization(id, name, description, slug);
        res.json({ message: 'Organization updated successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to update organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.update = update;
// ==================== DELETE ====================
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: sadece owner
        await authService.requireOrgOwner(userId, id);
        await orgService.deleteOrganization(id);
        res.json({ message: 'Organization deleted successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to delete organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.remove = remove;
// ==================== INVITE ====================
const invite = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { friendshipCode, role = 'member' } = req.body;
        if (!friendshipCode) {
            res.status(400).json({ error: 'friendshipCode is required' });
            return;
        }
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        // Yeni davet sistemini kullan
        const invitationId = await invitationService.createInvitation(id, // org_id
        friendshipCode, // friendshipCode
        'organization', // entity_type
        role, // role
        undefined // entity_id (org davetinde yok)
        );
        res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to invite to organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.invite = invite;
// ==================== MEMBERS ====================
const listMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        const members = await orgService.getOrganizationMembers(id);
        res.json(members);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to list members', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.listMembers = listMembers;
const updateMemberRole = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId;
        const { role } = req.body;
        const validRoles = ['admin', 'member', 'viewer'];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({ error: 'Invalid role. Allowed: admin, member, viewer' });
            return;
        }
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        await orgService.updateMemberRole(id, memberId, role);
        res.json({ message: 'Role updated successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to update member role', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateMemberRole = updateMemberRole;
const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        await orgService.removeMember(id, memberId);
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to remove member', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeMember = removeMember;
// ==================== INVITATIONS ====================
const listInvitations = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: owner veya admin
        await authService.requireOrgAdminOrOwner(userId, id);
        const invitations = await orgService.getPendingInvitations(id);
        res.json(invitations);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to list invitations', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.listInvitations = listInvitations;
const cancelInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(invitationId)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid invitation ID');
        }
        // Davetin hangi organizasyona ait olduğunu bul
        const orgId = await orgService.getInvitationOrgId(invitationId);
        if (!orgId) {
            // Şimdilik orgId bulunamazsa, DB fonksiyonu zaten yetki kontrolü yapıyor
            // O yüzden direkt DB'ye git, yetkiyi DB kontrol etsin
            await orgService.cancelInvitation(invitationId);
            res.json({ message: 'Invitation cancelled' });
            return;
        }
        // Yetki kontrolü: organizasyon admin veya owner'ı olmalı
        await authService.requireOrgAdminOrOwner(userId, orgId);
        await orgService.cancelInvitation(invitationId);
        res.json({ message: 'Invitation cancelled' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to cancel invitation', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.cancelInvitation = cancelInvitation;
// ==================== STATS ====================
const getStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: üye olan herkes görebilir
        await authService.requireOrgMember(userId, id);
        const stats = await orgService.getOrganizationStats(id);
        res.json(stats);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to get stats', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStats = getStats;
// ==================== LEAVE ====================
const leave = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Yetki kontrolü: üye olan herkes ayrılabilir (son owner kontrolü DB'de)
        await authService.requireOrgMember(userId, id);
        await orgService.leaveOrganization(id);
        res.json({ message: 'Successfully left organization' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to leave organization', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.leave = leave;
//# sourceMappingURL=organization.controller.js.map