import { z } from 'zod';

// ==================== CORE SCHEMAS ====================

// 1. Create Organization Schema
export const createOrganizationSchema = {
    source: 'body' as const,
    schema: z.object({
        name: z.string()
            .min(2, 'Organization name must be at least 2 characters')
            .max(100, 'Organization name cannot exceed 100 characters'),
        
        slug: z.string()
            .min(3, 'Slug must be at least 3 characters')
            .max(50, 'Slug cannot exceed 50 characters')
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
        
        description: z.string()
            .max(1000, 'Description cannot exceed 1000 characters')
            .optional(),
    })
};

// 2. Update Organization Schema (Tüm alanlar opsiyonel)
export const updateOrganizationSchema = {
    source: 'body' as const,
    schema: z.object({
        name: z.string()
            .min(2, 'Organization name must be at least 2 characters')
            .max(100, 'Organization name cannot exceed 100 characters')
            .optional(),
        
        slug: z.string()
            .min(3, 'Slug must be at least 3 characters')
            .max(50, 'Slug cannot exceed 50 characters')
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
            .optional(),
        
        description: z.string()
            .max(1000, 'Description cannot exceed 1000 characters')
            .optional(),
    })
};

// 3. Invite to Organization Schema
export const inviteToOrganizationSchema = {
    source: 'body' as const,
    schema: z.object({
        friendshipCode: z.string()
            .uuid('Invalid friendship code format. Must be a valid UUID.'),
        
        role: z.enum(['admin', 'member', 'viewer'])
            .default('member'),
    })
};

// 4. Update Member Role Schema
export const updateMemberRoleSchema = {
    source: 'body' as const,
    schema: z.object({
        role: z.enum(['admin', 'member', 'viewer']),
    })
};

// ==================== TYPE EXPORTS ====================
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema.schema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema.schema>;
export type InviteToOrganizationInput = z.infer<typeof inviteToOrganizationSchema.schema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema.schema>;