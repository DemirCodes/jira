// platform_backend/src/schemas/tenant.schema.ts

import { z } from 'zod';

// Tenant DB'den çekilecek veya oraya yazılacak veriler için Zod Kalkanı
export const tenantBugSchema = z.object({
    bug_id: z.string().uuid(),
    title: z.string().min(1, 'Başlık boş olamaz'),
    description: z.string().nullable().optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    org_id: z.string().uuid(),
    project_id: z.string().uuid().nullable().optional(),
    reported_by: z.string().uuid(),
    assigned_to: z.string().uuid().nullable().optional(),
    created_at: z.date(),
    resolved_at: z.date().nullable().optional(),
});

// Array (Liste) olarak dönüşler için
export const tenantBugListSchema = z.array(tenantBugSchema);

// TypeScript Type'ını türetiyoruz
export type TenantBug = z.infer<typeof tenantBugSchema>;