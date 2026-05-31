/**
 * INVITATION SERVICE
 */
import { InvitationWithDetails } from '../types/invitation.types';
export declare const createInvitation: (orgId: string, friendshipCode: string, entityType: "organization" | "site" | "project" | "issue", role: string, entityId?: string) => Promise<string>;
export declare const acceptInvitation: (invitationId: string) => Promise<void>;
export declare const rejectInvitation: (invitationId: string) => Promise<void>;
export declare const cancelInvitation: (invitationId: string) => Promise<void>;
export declare const getPendingInvitationsForUser: () => Promise<InvitationWithDetails[]>;
export declare const getPendingInvitationsForOrg: (orgId: string) => Promise<InvitationWithDetails[]>;
//# sourceMappingURL=invitation.service.d.ts.map