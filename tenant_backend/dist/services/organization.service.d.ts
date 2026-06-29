/**
 * ORGANIZATION SERVICE
 *
 * Tüm yetkilendirme auth_current_user_id() ile DB katmanında yapılır.
 * Servis sadece validasyon, tip kontrolü ve veri dönüşümünden sorumludur.
 */
import { Organization, OrganizationMember, OrganizationInvitation, OrganizationStats } from '../types/organization.types';
export declare const createOrganization: (userId: string, name: string, slug: string, description?: string) => Promise<string>;
export declare const getUserOrganizations: () => Promise<Organization[]>;
export declare const getOrganizationById: (orgId: string) => Promise<Organization | null>;
export declare const updateOrganization: (orgId: string, name?: string, description?: string, slug?: string) => Promise<void>;
export declare const deleteOrganization: (orgId: string) => Promise<void>;
export declare const inviteToOrganization: (orgId: string, friendshipCode: string, role: string) => Promise<string>;
export declare const getOrganizationMembers: (orgId: string) => Promise<OrganizationMember[]>;
export declare const updateMemberRole: (orgId: string, memberId: string, role: string) => Promise<void>;
export declare const removeMember: (orgId: string, memberId: string) => Promise<void>;
export declare const getPendingInvitations: (orgId: string) => Promise<OrganizationInvitation[]>;
export declare const getInvitationOrgId: (invitationId: string) => Promise<string | null>;
export declare const cancelInvitation: (invitationId: string) => Promise<void>;
export declare const getOrganizationStats: (orgId: string) => Promise<OrganizationStats | null>;
export declare const leaveOrganization: (orgId: string) => Promise<void>;
//# sourceMappingURL=organization.service.d.ts.map