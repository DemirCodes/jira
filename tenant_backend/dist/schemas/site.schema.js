"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSiteMemberRoleSchema = exports.inviteToSiteSchema = exports.updateSiteSchema = exports.createSiteSchema = void 0;
const zod_1 = require("zod");
// Create Site Schema
exports.createSiteSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Site name must be at least 2 characters')
        .max(100, 'Site name cannot exceed 100 characters'),
    slug: zod_1.z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    org_id: zod_1.z.string()
        .uuid('Invalid organization ID format'),
    description: zod_1.z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    is_private: zod_1.z.boolean()
        .default(false),
});
// Update Site Schema
exports.updateSiteSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Site name must be at least 2 characters')
        .max(100, 'Site name cannot exceed 100 characters')
        .optional(),
    slug: zod_1.z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .optional(),
    description: zod_1.z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    is_private: zod_1.z.boolean()
        .optional(),
});
// Invite to Site Schema
exports.inviteToSiteSchema = zod_1.z.object({
    friendshipCode: zod_1.z.string()
        .uuid('Invalid friendship code format'),
    role: zod_1.z.enum(['admin', 'contrubitor', 'viewer'])
        .default('contrubitor'),
});
// Update Member Role Schema
exports.updateSiteMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'contrubitor', 'viewer']),
});
//# sourceMappingURL=site.schema.js.map