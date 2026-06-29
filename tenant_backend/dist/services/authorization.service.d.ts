export declare enum OrgRole {
    OWNER = "owner",
    ADMIN = "admin",
    MEMBER = "member",
    VIEWER = "viewer"
}
export declare enum SiteRole {
    ADMIN = "admin",
    CONTRIBUTOR = "contrubitor",
    VIEWER = "viewer"
}
export declare enum ProjectRole {
    ADMIN = "project_admin",
    CONTRIBUTOR = "contributor",
    REVIEWER = "reviewer",
    VIEWER = "viewer"
}
export declare enum IssueRole {
    CONTRIBUTOR = "contributor",
    REVIEWER = "reviewer",
    WATCHER = "watcher"
}
export declare const requireOrgOwner: (userId: string, orgId: string) => Promise<void>;
export declare const requireOrgAdminOrOwner: (userId: string, orgId: string) => Promise<void>;
export declare const requireOrgMember: (userId: string, orgId: string) => Promise<void>;
export declare const requireSiteAdmin: (userId: string, siteId: string) => Promise<void>;
export declare const requireSiteMember: (userId: string, siteId: string) => Promise<void>;
export declare const requireSiteContributorOrAdmin: (userId: string, siteId: string) => Promise<void>;
export declare const requireSiteAdminOrOrgOwner: (userId: string, siteId: string) => Promise<void>;
export declare const requireSiteInvitePermission: (userId: string, siteId: string) => Promise<void>;
export declare const requireSiteAssetUploadPermission: (userId: string, siteId: string) => Promise<void>;
export declare const requireProjectAdmin: (userId: string, projectId: string) => Promise<void>;
export declare const requireProjectMember: (userId: string, projectId: string) => Promise<void>;
export declare const requireProjectContributorOrAdmin: (userId: string, projectId: string) => Promise<void>;
export declare const requireIssueContributor: (userId: string, issueId: string) => Promise<void>;
export declare const requireIssueParticipant: (userId: string, issueId: string) => Promise<void>;
export declare const requireIssueAdmin: (userId: string, issueId: string) => Promise<void>;
export declare const isIssueAssignee: (userId: string, issueId: string) => Promise<boolean>;
export declare const isIssueReporter: (userId: string, issueId: string) => Promise<boolean>;
//# sourceMappingURL=authorization.service.d.ts.map