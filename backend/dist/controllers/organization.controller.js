"use strict";
/**
 * ORGANIZATION CONTROLLER
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leave = exports.getStats = exports.cancelInvitation = exports.listInvitations = exports.removeMember = exports.updateMemberRole = exports.listMembers = exports.invite = exports.remove = exports.update = exports.getById = exports.list = exports.create = void 0;
var orgService = require("../services/organization.service");
// ==================== CREATE ====================
var create = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, name_1, slug, description, orgId, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.userId;
                _a = req.body, name_1 = _a.name, slug = _a.slug, description = _a.description;
                if (!name_1 || !slug) {
                    res.status(400).json({ error: 'name and slug are required' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, orgService.createOrganization(userId, name_1, slug, description)];
            case 1:
                orgId = _b.sent();
                res.status(201).json({ org_id: orgId });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                if (error_1.message.includes('already exists')) {
                    res.status(409).json({ error: 'Slug already exists' });
                }
                else {
                    res.status(500).json({ error: error_1.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.create = create;
// ==================== READ ====================
var list = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, orgs, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                return [4 /*yield*/, orgService.getUserOrganizations(userId)];
            case 1:
                orgs = _a.sent();
                res.json(orgs);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: error_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.list = list;
var getById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, org, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, orgService.getOrganizationById(id)];
            case 1:
                org = _a.sent();
                if (!org) {
                    res.status(404).json({ error: 'Organization not found' });
                    return [2 /*return*/];
                }
                res.json(org);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ error: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getById = getById;
// ==================== UPDATE ====================
var update = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, _a, name_2, description, slug, updated, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                _a = req.body, name_2 = _a.name, description = _a.description, slug = _a.slug;
                return [4 /*yield*/, orgService.updateOrganization(userId, id, name_2, description, slug)];
            case 1:
                updated = _b.sent();
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                if (error_4.message.includes('not found')) {
                    res.status(404).json({ error: 'Organization not found' });
                }
                else if (error_4.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_4.message.includes('slug already exists')) {
                    res.status(409).json({ error: 'Slug already exists' });
                }
                else {
                    res.status(500).json({ error: error_4.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.update = update;
// ==================== DELETE ====================
var remove = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                return [4 /*yield*/, orgService.deleteOrganization(userId, id)];
            case 1:
                _a.sent();
                res.json({ message: 'Organization deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                if (error_5.message.includes('not found')) {
                    res.status(404).json({ error: 'Organization not found' });
                }
                else if (error_5.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_5.message.includes('last owner')) {
                    res.status(400).json({ error: 'Cannot delete the last owner' });
                }
                else {
                    res.status(500).json({ error: error_5.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.remove = remove;
// ==================== INVITE ====================
var invite = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, _a, friendshipCode, _b, role, invitationId, error_6;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                _a = req.body, friendshipCode = _a.friendshipCode, _b = _a.role, role = _b === void 0 ? 'member' : _b;
                if (!friendshipCode) {
                    res.status(400).json({ error: 'friendshipCode is required' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, orgService.inviteToOrganization(userId, id, friendshipCode, role)];
            case 1:
                invitationId = _c.sent();
                res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _c.sent();
                if (error_6.message.includes('not found')) {
                    res.status(404).json({ error: 'Organization not found' });
                }
                else if (error_6.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_6.message.includes('already a member')) {
                    res.status(409).json({ error: 'User is already a member' });
                }
                else {
                    res.status(500).json({ error: error_6.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.invite = invite;
// ==================== MEMBERS ====================
var listMembers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, members, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                return [4 /*yield*/, orgService.getOrganizationMembers(userId, id)];
            case 1:
                members = _a.sent();
                res.json(members);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                if (error_7.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else {
                    res.status(500).json({ error: error_7.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.listMembers = listMembers;
var updateMemberRole = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, id, memberId, role, validRoles, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.userId;
                _a = req.params, id = _a.id, memberId = _a.memberId;
                role = req.body.role;
                validRoles = ['admin', 'member', 'viewer'];
                if (!role || !validRoles.includes(role)) {
                    res.status(400).json({ error: 'Invalid role. Allowed: admin, member, viewer' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, orgService.updateMemberRole(userId, id, memberId, role)];
            case 1:
                _b.sent();
                res.json({ message: 'Role updated successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                if (error_8.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_8.message.includes('not found')) {
                    res.status(404).json({ error: 'User or organization not found' });
                }
                else {
                    res.status(500).json({ error: error_8.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateMemberRole = updateMemberRole;
var removeMember = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, id, memberId, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.userId;
                _a = req.params, id = _a.id, memberId = _a.memberId;
                return [4 /*yield*/, orgService.removeMember(userId, id, memberId)];
            case 1:
                _b.sent();
                res.json({ message: 'Member removed successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _b.sent();
                if (error_9.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_9.message.includes('not found')) {
                    res.status(404).json({ error: 'User or organization not found' });
                }
                else if (error_9.message.includes('last owner')) {
                    res.status(400).json({ error: 'Cannot remove the last owner' });
                }
                else {
                    res.status(500).json({ error: error_9.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.removeMember = removeMember;
// ==================== INVITATIONS ====================
var listInvitations = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, invitations, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                return [4 /*yield*/, orgService.getPendingInvitations(userId, id)];
            case 1:
                invitations = _a.sent();
                res.json(invitations);
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                if (error_10.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else {
                    res.status(500).json({ error: error_10.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.listInvitations = listInvitations;
var cancelInvitation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, invitationId, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                invitationId = req.params.invitationId;
                return [4 /*yield*/, orgService.cancelInvitation(userId, invitationId)];
            case 1:
                _a.sent();
                res.json({ message: 'Invitation cancelled' });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                if (error_11.message.includes('not found')) {
                    res.status(404).json({ error: 'Invitation not found' });
                }
                else if (error_11.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else {
                    res.status(500).json({ error: error_11.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.cancelInvitation = cancelInvitation;
// ==================== STATS ====================
var getStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, stats, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                return [4 /*yield*/, orgService.getOrganizationStats(userId, id)];
            case 1:
                stats = _a.sent();
                res.json(stats);
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                if (error_12.message.includes('permission')) {
                    res.status(403).json({ error: 'Permission denied' });
                }
                else if (error_12.message.includes('not found')) {
                    res.status(404).json({ error: 'Organization not found' });
                }
                else {
                    res.status(500).json({ error: error_12.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getStats = getStats;
// ==================== LEAVE ====================
var leave = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.userId;
                id = req.params.id;
                return [4 /*yield*/, orgService.removeMember(userId, id, userId)];
            case 1:
                _a.sent();
                res.json({ message: 'Successfully left organization' });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _a.sent();
                if (error_13.message.includes('last owner')) {
                    res.status(400).json({ error: 'Last owner cannot leave. Transfer ownership first.' });
                }
                else {
                    res.status(500).json({ error: error_13.message });
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.leave = leave;
