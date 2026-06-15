import { z } from 'zod';

// ==================== CORE SCHEMAS ====================

// 1. Create Invitation Schema
export const createInvitationSchema = {
    source: 'body' as const,
    schema: z.object({
        org_id: z.string().uuid('Invalid organization ID'),
        friendshipCode: z.string().uuid('Invalid friendship code'),
        entity_type: z.enum(['organization', 'site', 'project', 'issue']),
        entity_id: z.string().uuid().optional(),
        role: z.string().min(1, 'Role is required'),
    })
};

// 2. Accept & Reject Invitation Schema
export const acceptInvitationSchema = {
    source: 'body' as const,
    schema: z.object({
        invitation_id: z.string().uuid('Invalid invitation ID'),
    })
};

// ==================== TYPE EXPORTS ====================
export type CreateInvitationInput = z.infer<typeof createInvitationSchema.schema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema.schema>;