import { z } from 'zod';

// TypeScript'in "No overload matches this call" hatasını önlemek için 
// enum dizilerini "as const" ile sabitliyoruz.
const projectStatuses = ['active', 'completed', 'archived'] as const;
const projectRoles = ['project_admin', 'contributor', 'reviewer', 'viewer'] as const;

// Create Project Schema
export const createProjectSchema = z.object({
    site_id: z.string().uuid('Invalid site ID format'),
    name: z.string()
        .min(2, 'Project name must be at least 2 characters')
        .max(100, 'Project name cannot exceed 100 characters'),
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    is_private: z.boolean().default(false),
});

// Update Project Schema
export const updateProjectSchema = z.object({
    site_id: z.string().uuid('Invalid site ID format'),
    name: z.string()
        .min(2, 'Project name must be at least 2 characters')
        .max(100, 'Project name cannot exceed 100 characters')
        .optional(),
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    is_private: z.boolean().optional(),
});

// Update Project Status Schema
export const updateProjectStatusSchema = z.object({
    site_id: z.string().uuid('Invalid site ID format'),
    status: z.enum(projectStatuses, {
        message: 'Status must be active, completed, or archived'
    }),
});

// Invite to Project Schema
export const inviteToProjectSchema = z.object({
    org_id: z.string().uuid('Invalid org ID format'),
    site_id: z.string().uuid('Invalid site ID format'),
    friendshipCode: z.string().uuid('Invalid friendship code format'),
    role: z.enum(projectRoles).default('contributor'),
});

// Update Member Role Schema
export const updateProjectMemberRoleSchema = z.object({
    site_id: z.string().uuid('Invalid site ID format'),
    role: z.enum(projectRoles),
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteToProjectInput = z.infer<typeof inviteToProjectSchema>;
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;