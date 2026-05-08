"use strict";
/**
 * ORGANIZATION SERVICE
 *
 * Tüm validasyonlar regexValidator.ts üzerinden yapılır
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
exports.leaveOrganization = exports.getOrganizationStats = exports.cancelInvitation = exports.getPendingInvitations = exports.removeMember = exports.updateMemberRole = exports.getOrganizationMembers = exports.inviteToOrganization = exports.deleteOrganization = exports.updateOrganization = exports.getOrganizationById = exports.getUserOrganizations = exports.createOrganization = void 0;
var tenantPool_1 = require("../db/tenantPool");
var regexValidator_1 = require("../utils/regexValidator");
// ==================== VALIDATION HELPERS ====================
var validateOrgInput = function (name, slug) {
    // Name validasyonu
    if (!(0, regexValidator_1.isValidName)(name, 2, 100)) {
        throw new Error('Invalid organization name. Must be 2-100 characters and contain only letters, spaces, dots and hyphens');
    }
    // Slug validasyonu
    if (!(0, regexValidator_1.isValidSlug)(slug, 3, 50)) {
        throw new Error('Invalid slug. Must be 3-50 characters and contain only lowercase letters, numbers and hyphens');
    }
    // XSS kontrolü
    if ((0, regexValidator_1.containsDangerousChars)(name) || (0, regexValidator_1.containsDangerousChars)(slug)) {
        throw new Error('Invalid characters detected in input');
    }
    // SQL injection kontrolü
    if ((0, regexValidator_1.containsSqlPatterns)(name) || (0, regexValidator_1.containsSqlPatterns)(slug)) {
        throw new Error('Invalid patterns detected in input');
    }
};
var validateUserId = function (userId) {
    if (!(0, regexValidator_1.isValidUUID)(userId)) {
        throw new Error('Invalid user ID format');
    }
};
var validateOrgId = function (orgId) {
    if (!(0, regexValidator_1.isValidUUID)(orgId)) {
        throw new Error('Invalid organization ID format');
    }
};
var validateFriendshipCode = function (code) {
    if (!code || code.length < 6 || code.length > 50) {
        throw new Error('Invalid friendship code format');
    }
    if ((0, regexValidator_1.containsDangerousChars)(code)) {
        throw new Error('Invalid characters in friendship code');
    }
};
var validateRole = function (role) {
    var validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
        throw new Error("Invalid role. Must be one of: ".concat(validRoles.join(', ')));
    }
};
// ==================== CREATE ====================
var createOrganization = function (userId, name, slug, description) { return __awaiter(void 0, void 0, void 0, function () {
    var sanitizedName, sanitizedSlug, sanitizedDescription, client, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // Validasyonlar
                validateUserId(userId);
                validateOrgInput(name, slug);
                // Description validasyonu (varsa)
                if (description) {
                    if (description.length > 1000) {
                        throw new Error('Description cannot exceed 1000 characters');
                    }
                    if ((0, regexValidator_1.containsDangerousChars)(description)) {
                        throw new Error('Invalid characters in description');
                    }
                }
                sanitizedName = (0, regexValidator_1.sanitizeInput)(name);
                sanitizedSlug = slug.toLowerCase().trim();
                sanitizedDescription = description ? (0, regexValidator_1.sanitizeInput)(description).substring(0, 1000) : null;
                return [4 /*yield*/, tenantPool_1.tenantPool.connect()];
            case 1:
                client = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 6, 8, 9]);
                return [4 /*yield*/, client.query('BEGIN')];
            case 3:
                _b.sent();
                return [4 /*yield*/, client.query('SELECT create_organization($1, $2, $3, $4) as org_id', [userId, sanitizedName, sanitizedSlug, sanitizedDescription])];
            case 4:
                result = _b.sent();
                return [4 /*yield*/, client.query('COMMIT')];
            case 5:
                _b.sent();
                if (!((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.org_id)) {
                    throw new Error('Failed to create organization');
                }
                return [2 /*return*/, result.rows[0].org_id];
            case 6:
                error_1 = _b.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 7:
                _b.sent();
                if (error_1.message.includes('already exists') || error_1.code === '23505') {
                    throw new Error('Slug already exists');
                }
                throw error_1;
            case 8:
                client.release();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.createOrganization = createOrganization;
// ==================== READ ====================
var getUserOrganizations = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT * FROM list_user_organizations($1)', [userId])];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows];
        }
    });
}); };
exports.getUserOrganizations = getUserOrganizations;
var getOrganizationById = function (orgId) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT * FROM get_organization_by_id($1)', [orgId])];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows[0] || null];
        }
    });
}); };
exports.getOrganizationById = getOrganizationById;
// ==================== UPDATE ====================
var updateOrganization = function (userId, orgId, name, description, slug) { return __awaiter(void 0, void 0, void 0, function () {
    var sanitizedName, sanitizedSlug, sanitizedDescription, client, result, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                // Name validasyonu
                if (name) {
                    if (!(0, regexValidator_1.isValidName)(name, 2, 100)) {
                        throw new Error('Invalid organization name');
                    }
                    if ((0, regexValidator_1.containsDangerousChars)(name)) {
                        throw new Error('Invalid characters in name');
                    }
                }
                // Slug validasyonu
                if (slug) {
                    if (!(0, regexValidator_1.isValidSlug)(slug, 3, 50)) {
                        throw new Error('Invalid slug format');
                    }
                    if ((0, regexValidator_1.containsDangerousChars)(slug)) {
                        throw new Error('Invalid characters in slug');
                    }
                }
                // Description validasyonu
                if (description) {
                    if (description.length > 1000) {
                        throw new Error('Description cannot exceed 1000 characters');
                    }
                    if ((0, regexValidator_1.containsDangerousChars)(description)) {
                        throw new Error('Invalid characters in description');
                    }
                }
                sanitizedName = name ? (0, regexValidator_1.sanitizeInput)(name) : null;
                sanitizedSlug = slug ? slug.toLowerCase().trim() : null;
                sanitizedDescription = description ? (0, regexValidator_1.sanitizeInput)(description).substring(0, 1000) : null;
                return [4 /*yield*/, tenantPool_1.tenantPool.connect()];
            case 1:
                client = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 6, 8, 9]);
                return [4 /*yield*/, client.query('BEGIN')];
            case 3:
                _b.sent();
                return [4 /*yield*/, client.query('SELECT update_organization($1, $2, $3, $4, $5) as org', [orgId, sanitizedName, sanitizedDescription, sanitizedSlug, userId])];
            case 4:
                result = _b.sent();
                return [4 /*yield*/, client.query('COMMIT')];
            case 5:
                _b.sent();
                if (!((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.org)) {
                    throw new Error('Organization not found or update failed');
                }
                return [2 /*return*/, result.rows[0].org];
            case 6:
                error_2 = _b.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 7:
                _b.sent();
                if (error_2.message.includes('permission')) {
                    throw new Error('Permission denied');
                }
                if (error_2.message.includes('slug already exists')) {
                    throw new Error('Slug already exists');
                }
                throw error_2;
            case 8:
                client.release();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.updateOrganization = updateOrganization;
// ==================== DELETE ====================
var deleteOrganization = function (userId, orgId) { return __awaiter(void 0, void 0, void 0, function () {
    var client, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.connect()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 6, 8, 9]);
                return [4 /*yield*/, client.query('BEGIN')];
            case 3:
                _a.sent();
                return [4 /*yield*/, client.query('SELECT delete_organization($1, $2)', [orgId, userId])];
            case 4:
                _a.sent();
                return [4 /*yield*/, client.query('COMMIT')];
            case 5:
                _a.sent();
                return [3 /*break*/, 9];
            case 6:
                error_3 = _a.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 7:
                _a.sent();
                if (error_3.message.includes('permission')) {
                    throw new Error('Permission denied');
                }
                if (error_3.message.includes('last owner')) {
                    throw new Error('Cannot delete the last owner');
                }
                throw error_3;
            case 8:
                client.release();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.deleteOrganization = deleteOrganization;
// ==================== INVITE ====================
var inviteToOrganization = function (userId, orgId, friendshipCode, role) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                validateFriendshipCode(friendshipCode);
                validateRole(role);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT invite_to_organization($1, $2, $3, $4) as invitation_id', [userId, orgId, friendshipCode, role])];
            case 1:
                result = _b.sent();
                if (!((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.invitation_id)) {
                    throw new Error('Failed to send invitation');
                }
                return [2 /*return*/, result.rows[0].invitation_id];
        }
    });
}); };
exports.inviteToOrganization = inviteToOrganization;
// ==================== MEMBERS ====================
var getOrganizationMembers = function (userId, orgId) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT * FROM get_organization_members($1, $2)', [orgId, userId])];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows];
        }
    });
}); };
exports.getOrganizationMembers = getOrganizationMembers;
var updateMemberRole = function (userId, orgId, memberId, role) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                validateUserId(memberId);
                validateRole(role);
                // Kendi rolünü değiştirmeye çalışıyorsa kontrol
                if (userId === memberId) {
                    throw new Error('Cannot change your own role');
                }
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT update_member_role($1, $2, $3, $4)', [orgId, memberId, role, userId])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.updateMemberRole = updateMemberRole;
var removeMember = function (userId, orgId, memberId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                validateUserId(memberId);
                // Kendini çıkarmaya çalışıyorsa leave endpoint'ini kullan
                if (userId === memberId) {
                    throw new Error('Use leave endpoint to remove yourself');
                }
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT remove_member($1, $2, $3)', [orgId, memberId, userId])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.removeMember = removeMember;
// ==================== INVITATIONS ====================
var getPendingInvitations = function (userId, orgId) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT * FROM get_pending_invitations($1, $2)', [orgId, userId])];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows];
        }
    });
}); };
exports.getPendingInvitations = getPendingInvitations;
var cancelInvitation = function (userId, invitationId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                if (!(0, regexValidator_1.isValidUUID)(invitationId)) {
                    throw new Error('Invalid invitation ID format');
                }
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT cancel_invitation($1, $2)', [invitationId, userId])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.cancelInvitation = cancelInvitation;
// ==================== STATS ====================
var getOrganizationStats = function (userId, orgId) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT * FROM get_organization_stats($1, $2)', [orgId, userId])];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows[0]];
        }
    });
}); };
exports.getOrganizationStats = getOrganizationStats;
// ==================== LEAVE ====================
var leaveOrganization = function (userId, orgId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validateUserId(userId);
                validateOrgId(orgId);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SELECT leave_organization($1, $2)', [orgId, userId])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.leaveOrganization = leaveOrganization;
