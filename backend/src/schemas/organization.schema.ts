import { z } from 'zod';

// Create Organization Schema
export const createOrganizationSchema = z.object({
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
});

// Update Organization Schema (tüm alanlar opsiyonel)
export const updateOrganizationSchema = z.object({
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
});

// Invite to Organization Schema
export const inviteToOrganizationSchema = z.object({
    friendshipCode: z.string()
        .uuid('Invalid friendship code format. Must be a valid UUID.'),
    
    role: z.enum(['admin', 'member', 'viewer'])
        .default('member'),
});

// Update Member Role Schema
export const updateMemberRoleSchema = z.object({
    role: z.enum(['admin', 'member', 'viewer']),
});

// Type exports
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteToOrganizationInput = z.infer<typeof inviteToOrganizationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;