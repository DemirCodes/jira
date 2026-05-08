"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middlewares/auth");
var c = require("../controllers/organization.controller");
var router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Core CRUD
router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
// Invitations
router.post('/:id/invite', c.invite);
router.get('/:id/invitations', c.listInvitations);
router.delete('/:id/invitations/:invitationId', c.cancelInvitation);
// Members
router.get('/:id/members', c.listMembers);
router.put('/:id/members/:memberId/role', c.updateMemberRole);
router.delete('/:id/members/:memberId', c.removeMember);
router.post('/:id/leave', c.leave);
// Stats
router.get('/:id/stats', c.getStats);
exports.default = router;
