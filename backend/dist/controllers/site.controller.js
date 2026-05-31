"use strict";
/**
 * SITE CONTROLLER
 *
 * Tüm yetkilendirme authorization.service.ts ile yapılır.
 * Controller sadece request/response işlemlerinden sorumludur.
 *
 * GÜVENLİK: Tüm yazma işlemlerinde org_id validasyonu yapılır.
 */
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
exports.getStats = exports.removeMember = exports.updateMemberRole = exports.listMembers = exports.invite = exports.remove = exports.updateStatus = exports.update = exports.getById = exports.listByOrg = exports.create = void 0;
const siteService = __importStar(require("../services/site.service"));
const authService = __importStar(require("../services/authorization.service"));
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
const regexValidator_1 = require("../utils/regexValidator");
// ==================== CREATE ====================
const create = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, slug, org_id } = req.body;
        if (!name || !slug || !org_id) {
            res.status(400).json({ error: 'name, slug, and org_id are required' });
            return;
        }
        // Yetki: org_owner veya org_admin
        await authService.requireOrgAdminOrOwner(userId, org_id);
        const siteId = await siteService.createSite(name, slug, org_id);
        res.status(201).json({ site_id: siteId });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to create site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.create = create;
// ==================== READ ====================
const listByOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(orgId)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid organization ID');
        }
        // Yetki: org member (owner, admin, member, viewer)
        await authService.requireOrgMember(userId, orgId);
        const sites = await siteService.getSitesByOrg(orgId);
        res.json(sites);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to list sites', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.listByOrg = listByOrg;
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }
        // Yetki: site_member veya org_owner/admin (hiyerarşik)
        await authService.requireSiteMember(userId, id);
        const site = await siteService.getSiteById(id);
        if (!site) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }
        res.json(site);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to get site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getById = getById;
// ==================== UPDATE ====================
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { org_id, name, slug, is_private } = req.body;
        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(org_id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);
        await siteService.updateSite(id, org_id, name, slug, is_private);
        res.json({ message: 'Site updated successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to update site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.update = update;
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { org_id, status } = req.body;
        if (!org_id || !status) {
            res.status(400).json({ error: 'org_id and status are required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(org_id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);
        await siteService.updateSiteStatus(id, org_id, status);
        res.json({ message: 'Site status updated successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to update site status', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateStatus = updateStatus;
// ==================== DELETE ====================
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { org_id } = req.body;
        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(org_id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);
        await siteService.deleteSite(id, org_id);
        res.json({ message: 'Site deleted successfully' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to delete site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.remove = remove;
// ==================== INVITE ====================
const invite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { org_id, friendshipCode, role = 'contrubitor' } = req.body;
        if (!friendshipCode || !org_id) {
            res.status(400).json({ error: 'friendshipCode and org_id are required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(org_id) || !(0, regexValidator_1.isValidUUID)(friendshipCode)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner, org_admin veya site_admin
        await authService.requireSiteInvitePermission(userId, id);
        // Davet sistemini kullan
        const invitationService = await Promise.resolve().then(() => __importStar(require('../services/invitation.service')));
        const invitationId = await invitationService.createInvitation(org_id, friendshipCode, 'site', role, id);
        res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to invite to site', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.invite = invite;
// ==================== MEMBERS ====================
const listMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }
        // Yetki: site member (viewer dahil)
        await authService.requireSiteMember(userId, id);
        const members = await siteService.getSiteMembers(id);
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
        const { org_id, role } = req.body;
        if (!org_id || !role) {
            res.status(400).json({ error: 'org_id and role are required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(memberId) || !(0, regexValidator_1.isValidUUID)(org_id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);
        await siteService.updateSiteMemberRole(id, org_id, memberId, role);
        res.json({ message: 'Member role updated successfully' });
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
        const { org_id } = req.body;
        if (!org_id) {
            res.status(400).json({ error: 'org_id is required' });
            return;
        }
        if (!(0, regexValidator_1.isValidUUID)(id) || !(0, regexValidator_1.isValidUUID)(memberId) || !(0, regexValidator_1.isValidUUID)(org_id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid UUID format');
        }
        // Yetki: org_owner veya site_admin
        await authService.requireSiteAdminOrOrgOwner(userId, id);
        await siteService.removeSiteMember(id, org_id, memberId);
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
// ==================== STATS ====================
const getStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(id)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID, 'Invalid site ID');
        }
        // Yetki: site member
        await authService.requireSiteMember(userId, id);
        const stats = await siteService.getSiteStats(id);
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
//# sourceMappingURL=site.controller.js.map