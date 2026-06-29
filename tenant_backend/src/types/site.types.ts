/**
 * SITE TYPES
 */

export interface Site {
    site_id: string;
    org_id: string;
    site_name: string;
    site_slug: string;
    site_status: 'active' | 'archived' | 'suspended';
    is_private: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export interface SiteMember {
    user_id: string;
    user_name: string;
    user_email: string;
    role: 'admin' | 'contrubitor' | 'viewer';
    joined_at: Date;
    invited_by: string;
}

export interface SiteInvitation {
    invitation_id: string;
    site_id: string;
    invited_user_id: string;
    invited_by_user_id: string;
    role: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    created_at: Date;
    expires_at: Date;
}

export interface SiteStats {
    total_members: number;
    total_projects: number;
    active_projects: number;
    created_at: Date;
}