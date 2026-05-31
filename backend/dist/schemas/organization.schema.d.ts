import { z } from 'zod';
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const inviteToOrganizationSchema: z.ZodObject<{
    friendshipCode: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        admin: "admin";
        member: "member";
        viewer: "viewer";
    }>>;
}, z.core.$strip>;
export declare const updateMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        admin: "admin";
        member: "member";
        viewer: "viewer";
    }>;
}, z.core.$strip>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteToOrganizationInput = z.infer<typeof inviteToOrganizationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
//# sourceMappingURL=organization.schema.d.ts.map