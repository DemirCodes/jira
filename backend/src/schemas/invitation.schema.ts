import { z } from 'zod';

export const createInvitationSchema = z.object({
    org_id: z.string().uuid('Invalid organization ID'),
    friendshipCode: z.string().uuid('Invalid friendship code'),
    entity_type: z.enum(['organization', 'site', 'project', 'issue']),
    entity_id: z.string().uuid().optional(),
    role: z.string().min(1, 'Role is required'),
});

export const acceptInvitationSchema = z.object({
    invitation_id: z.string().uuid('Invalid invitation ID'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;