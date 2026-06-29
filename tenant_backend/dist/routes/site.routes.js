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
const site_schema_1 = require("../schemas/site.schema");
const siteController = __importStar(require("../controllers/site.controller"));
const rateLimit_1 = require("../middlewares/rateLimit");
const router = (0, express_1.Router)();
// CRUD
router.post('/', (0, validate_1.validate)(site_schema_1.createSiteSchema), siteController.create);
router.get('/org/:orgId', siteController.listByOrg);
router.get('/:id', siteController.getById);
router.put('/:id', (0, validate_1.validate)(site_schema_1.updateSiteSchema), siteController.update);
router.patch('/:id/status', siteController.updateStatus);
router.delete('/:id', siteController.remove);
// Invite
router.post('/:id/invite', rateLimit_1.inviteLimiter, (0, validate_1.validate)(site_schema_1.inviteToSiteSchema), siteController.invite);
router.put('/:id/members/:memberId/role', rateLimit_1.memberManagementLimiter, (0, validate_1.validate)(site_schema_1.updateSiteMemberRoleSchema), siteController.updateMemberRole);
router.delete('/:id/members/:memberId', rateLimit_1.memberManagementLimiter, siteController.removeMember);
// Members
router.get('/:id/members', siteController.listMembers);
router.put('/:id/members/:memberId/role', (0, validate_1.validate)(site_schema_1.updateSiteMemberRoleSchema), siteController.updateMemberRole);
router.delete('/:id/members/:memberId', siteController.removeMember);
// Stats
router.get('/:id/stats', siteController.getStats);
exports.default = router;
//# sourceMappingURL=site.routes.js.map