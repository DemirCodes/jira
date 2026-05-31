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
const express_1 = require("express");
const validate_1 = require("../middlewares/validate");
const organization_schema_1 = require("../schemas/organization.schema");
const orgController = __importStar(require("../controllers/organization.controller"));
const rateLimit_1 = require("../middlewares/rateLimit");
const router = (0, express_1.Router)();
router.post('/', (0, validate_1.validate)(organization_schema_1.createOrganizationSchema), orgController.create);
router.get('/', orgController.list);
router.get('/:id', orgController.getById);
router.patch('/:id', (0, validate_1.validate)(organization_schema_1.updateOrganizationSchema), orgController.update);
router.delete('/:id', orgController.remove);
// Members
router.get('/:id/members', orgController.listMembers);
router.patch('/:id/members/:memberId', (0, validate_1.validate)(organization_schema_1.updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', orgController.removeMember);
// Invitations
router.post('/:id/invite', rateLimit_1.inviteLimiter, (0, validate_1.validate)(organization_schema_1.inviteToOrganizationSchema), orgController.invite);
router.put('/:id/members/:memberId/role', rateLimit_1.memberManagementLimiter, (0, validate_1.validate)(organization_schema_1.updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', rateLimit_1.memberManagementLimiter, orgController.removeMember);
// Stats & Leave
router.get('/:id/stats', orgController.getStats);
router.post('/:id/leave', orgController.leave);
exports.default = router;
//# sourceMappingURL=organization.routes.js.map