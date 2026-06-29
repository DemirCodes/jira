// ============================================================================
// ISSUE TYPES & INTERFACES
// ============================================================================

export type IssueStatus = 'open' | 'in_progress' | 'in_review' | 'resolved' | 'closed' | 'rejected' | 'fixed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IssueRole = 'contributor' | 'reviewer' | 'watcher';

// list_issues DB fonksiyonundan dönen özet veri tipi
export interface IssueSummary {
    issue_id: string;
    issue_no: string | number;
    issue_title: string;
    status: IssueStatus;
    priority: PriorityLevel;
    reporter_id: string;
    assignee_id: string | null;
    created_at: Date;
    updated_at: Date;
    comment_count: string | number;
    member_count: string | number;
}

// get_issue_id DB fonksiyonundan dönen tüm detayları kapsayan veri tipi
export interface IssueDetail {
    issue_id: string;
    issue_no: string | number;
    issue_title: string;
    issue_description: string | null;
    status: IssueStatus;
    priority: PriorityLevel;
    reporter_id: string;
    assignee_id: string | null;
    parent_issue_id: string | null;
    blocking_issue_id: string | null;
    is_private: boolean;
    is_editable: boolean;
    created_at: Date;
    updated_at: Date;
    project_id: string;
    project_name: string;
    site_id: string;
    site_name: string;
    org_id: string;
    org_name: string;
    reporter_name: string;
    assignee_name: string | null;
}