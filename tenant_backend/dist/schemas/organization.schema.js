"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberRoleSchema = exports.inviteToOrganizationSchema = exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
// Create Organization Schema
exports.createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name cannot exceed 100 characters'),
    slug: zod_1.z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    description: zod_1.z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
});
// Update Organization Schema (tüm alanlar opsiyonel)
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name cannot exceed 100 characters')
        .optional(),
    slug: zod_1.z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .optional(),
    description: zod_1.z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
});
// Invite to Organization Schema
exports.inviteToOrganizationSchema = zod_1.z.object({
    friendshipCode: zod_1.z.string()
        .uuid('Invalid friendship code format. Must be a valid UUID.'),
    role: zod_1.z.enum(['admin', 'member', 'viewer'])
        .default('member'),
});
// Update Member Role Schema
exports.updateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'member', 'viewer']),
});
//# sourceMappingURL=organization.schema.js.map