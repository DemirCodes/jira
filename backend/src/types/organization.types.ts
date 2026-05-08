/**
 * ORGANIZATION TYPES
 */

export interface Organization {
    org_id: string;
    org_name: string;
    org_description: string | null;
    slug: string;
    org_status: string;
    created_at: Date;
    created_by: string;
    member_count?: number;
    user_role?: string;
}

export interface OrganizationMember {
    user_id: string;
    user_name: string;
    user_email: string;
    role: string;
    joined_at: Date;
    invited_by: string;
}

export interface OrganizationInvitation {
    invitation_id: string;
    organization_id: string;
    invited_email: string;
    invited_by_user_id: string;
    role: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    token_hash: string;
    expires_at: Date;
    created_at: Date;
}

export interface OrganizationStats {
    total_members: number;
    total_projects: number;
    total_issues: number;
    active_invitations: number;
    created_at: Date;
}