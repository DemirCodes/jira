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
exports.listOrgInvitations = exports.listMyInvitations = exports.cancel = exports.reject = exports.accept = exports.create = void 0;
const invitationService = __importStar(require("../services/invitation.service"));
const authService = __importStar(require("../services/authorization.service"));
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
const regexValidator_1 = require("../utils/regexValidator");
// CREATE
const create = async (req, res) => {
    try {
        const userId = req.userId;
        const { org_id, friendshipCode, entity_type, entity_id, role } = req.body;
        if (!org_id || !friendshipCode || !entity_type || !role) {
            res.status(400).json({ error: 'org_id, friendshipCode, entity_type, and role are required' });
            return;
        }
        // entity_type validasyonu
        const validTypes = ['organization', 'site', 'project', 'issue'];
        if (!validTypes.includes(entity_type)) {
            res.status(400).json({ error: 'Invalid entity_type. Must be: organization, site, project, issue' });
            return;
        }
        // Yetki kontrolü
        await authService.requireOrgAdminOrOwner(userId, org_id);
        const invitationId = await invitationService.createInvitation(org_id, friendshipCode, entity_type, role, entity_id);
        res.status(201).json({ invitation_id: invitationId });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        logger_1.log.error('Controller: Failed to create invitation', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.create = create;
// ACCEPT
const accept = async (req, res) => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.acceptInvitation(invitation_id);
        res.json({ message: 'Invitation accepted' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};
exports.accept = accept;
// REJECT
const reject = async (req, res) => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.rejectInvitation(invitation_id);
        res.json({ message: 'Invitation rejected' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};
exports.reject = reject;
// CANCEL
const cancel = async (req, res) => {
    try {
        const { invitation_id } = req.body;
        if (!invitation_id) {
            res.status(400).json({ error: 'invitation_id is required' });
            return;
        }
        await invitationService.cancelInvitation(invitation_id);
        res.json({ message: 'Invitation cancelled' });
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};
exports.cancel = cancel;
// LIST (kullanıcının kendi davetleri)
const listMyInvitations = async (req, res) => {
    try {
        const invitations = await invitationService.getPendingInvitationsForUser();
        res.json(invitations);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Failed to retrieve invitations' });
    }
};
exports.listMyInvitations = listMyInvitations;
// LIST (organizasyonun bekleyen davetleri - admin/owner)
const listOrgInvitations = async (req, res) => {
    try {
        const { orgId } = req.params;
        const userId = req.userId;
        if (!(0, regexValidator_1.isValidUUID)(orgId)) {
            throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_INVALID_UUID);
        }
        // Yetki: org admin/owner
        await authService.requireOrgAdminOrOwner(userId, orgId);
        const invitations = await invitationService.getPendingInvitationsForOrg(orgId);
        res.json(invitations);
    }
    catch (error) {
        if (error instanceof errorCodes_1.AppError) {
            res.status(error.statusCode).json({ error: error.message, code: error.errorCode });
            return;
        }
        res.status(500).json({ error: 'Failed to retrieve invitations' });
    }
};
exports.listOrgInvitations = listOrgInvitations;
//# sourceMappingURL=invitation.controller.js.map