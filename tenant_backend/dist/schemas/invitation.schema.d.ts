import { z } from 'zod';
export declare const createInvitationSchema: z.ZodObject<{
    org_id: z.ZodString;
    friendshipCode: z.ZodString;
    entity_type: z.ZodEnum<{
        organization: "organization";
        site: "site";
        project: "project";
        issue: "issue";
    }>;
    entity_id: z.ZodOptional<z.ZodString>;
    role: z.ZodString;
}, z.core.$strip>;
export declare const acceptInvitationSchema: z.ZodObject<{
    invitation_id: z.ZodString;
}, z.core.$strip>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
//# sourceMappingURL=invitation.schema.d.ts.map