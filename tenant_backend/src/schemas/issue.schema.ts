import { z } from 'zod';

// Enum tanımlamaları (DB ile birebir aynı)
const IssueStatusEnum = z.enum(['open', 'in_progress', 'in_review', 'resolved', 'closed', 'rejected', 'fixed']);
const PriorityLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);
const IssueRoleEnum = z.enum(['contributor', 'reviewer', 'watcher']);

export const createIssueSchema = z.object({
    project_id: z.string().uuid('Geçerli bir project_id (UUID) gereklidir'),
    title: z.string().min(2).max(255),
    description: z.string().max(5000).optional().nullable(),
    is_private: z.boolean().optional()
});

export const updateIssueSchema = z.object({
    project_id: z.string().uuid('Yetki kontrolü için project_id zorunludur'),
    title: z.string().min(2).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: IssueStatusEnum.optional(),
    priority: PriorityLevelEnum.optional(),
    assignee_id: z.string().uuid().optional().nullable(),
    is_private: z.boolean().optional()
});

export const listIssuesSchema = z.object({
    project_id: z.string().uuid().optional(),
    status: IssueStatusEnum.optional(),
    priority: PriorityLevelEnum.optional(),
    assignee_id: z.string().uuid().optional(),
    reporter_id: z.string().uuid().optional(),
    search: z.string().max(100).optional(),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    offset: z.string().regex(/^\d+$/).optional().transform(Number)
});

export const getIssueSchema = z.object({
    id: z.string().uuid('Geçersiz issue_id')
});

export const deleteOrRestoreIssueSchema = z.object({
    project_id: z.string().uuid('Yetki kontrolü için project_id zorunludur')
});

export const inviteIssueSchema = z.object({
    friendship_code: z.string().uuid('Geçerli bir friendship_code gereklidir'),
    org_id: z.string().uuid(),
    site_id: z.string().uuid(),
    project_id: z.string().uuid(),
    role: IssueRoleEnum
});