import { z } from 'zod';

// Create Site Schema
export const createSiteSchema = z.object({
    name: z.string()
        .min(2, 'Site name must be at least 2 characters')
        .max(100, 'Site name cannot exceed 100 characters'),

    slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),

    org_id: z.string()
        .uuid('Invalid organization ID format'),

    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),

    is_private: z.boolean()
        .default(false),
});

// Update Site Schema
export const updateSiteSchema = z.object({
    name: z.string()
        .min(2, 'Site name must be at least 2 characters')
        .max(100, 'Site name cannot exceed 100 characters')
        .optional(),

    slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .optional(),

    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),

    is_private: z.boolean()
        .optional(),
});

// Invite to Site Schema
export const inviteToSiteSchema = z.object({
    friendshipCode: z.string()
        .uuid('Invalid friendship code format'),

    // 🎯 TYPO DÜZELTİLDİ: "contrubitor" -> "contributor"
    role: z.enum(['admin', 'contributor', 'viewer'])
        .default('contributor'),
});

// Update Member Role Schema
export const updateSiteMemberRoleSchema = z.object({
    // 🎯 TYPO DÜZELTİLDİ: "contrubitor" -> "contributor"
    role: z.enum(['admin', 'contributor', 'viewer']),
});

// Type exports
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type InviteToSiteInput = z.infer<typeof inviteToSiteSchema>;
export type UpdateSiteMemberRoleInput = z.infer<typeof updateSiteMemberRoleSchema>;