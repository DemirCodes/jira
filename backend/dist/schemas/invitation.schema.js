"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitationSchema = exports.createInvitationSchema = void 0;
const zod_1 = require("zod");
exports.createInvitationSchema = zod_1.z.object({
    org_id: zod_1.z.string().uuid('Invalid organization ID'),
    friendshipCode: zod_1.z.string().uuid('Invalid friendship code'),
    entity_type: zod_1.z.enum(['organization', 'site', 'project', 'issue']),
    entity_id: zod_1.z.string().uuid().optional(),
    role: zod_1.z.string().min(1, 'Role is required'),
});
exports.acceptInvitationSchema = zod_1.z.object({
    invitation_id: zod_1.z.string().uuid('Invalid invitation ID'),
});
//# sourceMappingURL=invitation.schema.js.map