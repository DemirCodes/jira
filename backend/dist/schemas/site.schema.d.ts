import { z } from 'zod';
export declare const createSiteSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    org_id: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    is_private: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateSiteSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    is_private: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const inviteToSiteSchema: z.ZodObject<{
    friendshipCode: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        contrubitor: "contrubitor";
    }>>;
}, z.core.$strip>;
export declare const updateSiteMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        contrubitor: "contrubitor";
    }>;
}, z.core.$strip>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type InviteToSiteInput = z.infer<typeof inviteToSiteSchema>;
export type UpdateSiteMemberRoleInput = z.infer<typeof updateSiteMemberRoleSchema>;
//# sourceMappingURL=site.schema.d.ts.map