/**
 * PROJECT TYPES
 */

export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectRole = 'project_admin' | 'contributor' | 'reviewer' | 'viewer';

export interface Project {
    project_id: string;
    site_id: string;
    project_check_id: string;
    project_name: string;
    project_description: string | null;
    slug: string | null;
    project_status: ProjectStatus;
    is_private: boolean;
    created_by: string | null;
    completed_at: Date | null;
    completed_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface ProjectSummary {
    project_id: string;
    project_name: string;
    project_description: string | null;
    slug: string | null;
    project_status: ProjectStatus;
    is_private: boolean;
    created_at: Date;
    created_by: string | null;
    completed_at: Date | null;
    completed_by: string | null;
    site_id: string;
    site_name: string;
    org_id: string;
    org_name: string;
    total_issues: number;
    open_issues: number;
    total_members: number;
    total_requirements: number;
    completed_requirements: number;
}

export interface ProjectMember {
    user_id: string;
    user_name: string;
    user_email: string;
    role: ProjectRole;
    joined_at: Date;
    invited_by: string;
}