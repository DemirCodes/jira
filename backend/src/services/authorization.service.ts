import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import type { ErrorCode } from '../utils/errorCodes';
import { log } from '../utils/logger';

// ==================== ENUMS (Rol Tanımlamaları) ====================
export enum OrgRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    VIEWER = 'viewer'
}

export enum SiteRole {
    ADMIN = 'admin',
    CONTRIBUTOR = 'contrubitor',
    VIEWER = 'viewer'
}

export enum ProjectRole {
    ADMIN = 'project_admin',
    CONTRIBUTOR = 'contributor',
    REVIEWER = 'reviewer',
    VIEWER = 'viewer'
}

export enum IssueRole {
    CONTRIBUTOR = 'contributor',
    REVIEWER = 'reviewer',
    WATCHER = 'watcher'
}

// ==================== TİPLER ====================
type MembershipTable = 'organization_memberships' | 'site_memberships' | 'project_memberships' | 'issue_memberships';
type EntityColumn = 'org_id' | 'site_id' | 'project_id' | 'issue_id';

// ==================== YARDIMCI FONKSİYONLAR ====================

const isOrgOwnerOrAdmin = async (userId: string, orgId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        `SELECT 1 FROM organization_memberships 
         WHERE org_id = $1 
           AND user_id = $2 
           AND role IN ('owner', 'admin')
           AND membership_is_active = true 
           AND deleted_at IS NULL`,
        [orgId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

const getEntityOrgId = async (tableName: string, columnName: string, entityId: string): Promise<string | null> => {
    let query = '';
    if (tableName === 'projects') {
        query = `SELECT s.org_id FROM projects p JOIN sites s ON s.site_id = p.site_id WHERE p.${columnName} = $1`;
    } else if (tableName === 'sites') {
        query = `SELECT org_id FROM sites WHERE ${columnName} = $1`;
    } else if (tableName === 'issues') {
        query = `SELECT s.org_id FROM issues i JOIN projects p ON p.project_id = i.project_id JOIN sites s ON s.site_id = p.site_id WHERE i.${columnName} = $1`;
    }
    if (!query) return null;
    const result = await tenantPool.query(query, [entityId]);
    return result.rows[0]?.org_id || null;
};

const isEntityPrivate = async (tableName: string, columnName: string, entityId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        `SELECT is_private FROM ${tableName} WHERE ${columnName} = $1 AND deleted_at IS NULL`,
        [entityId]
    );
    return result.rows[0]?.is_private || false;
};

const getDeniedMessage = (baseMessage: string, currentRole: string, allowedRoles: string[]): string => {
    if (process.env.NODE_ENV === 'production') {
        return 'You do not have sufficient permissions to perform this action.';
    }
    return `${baseMessage}. Your current role is '${currentRole}'. Required: ${allowedRoles.join(' or ')}.`;
};

// ==================== MERKEZİ YETKİ KONTROL MOTORU ====================

const enforcePermission = async (
    tableName: MembershipTable,
    columnName: EntityColumn,
    entityId: string,
    userId: string,
    allowedRoles: string[],
    errorCode: ErrorCode,
    errorMessage: string,
    checkOrgHierarchy: boolean = false,
    checkPrivate: boolean = false,
    privateAllowedRoles: string[] = [],
): Promise<void> => {
    let currentRole: string | null = null;

    // 1. Doğrudan üyelik kontrolü
    const directQuery = `
        SELECT role FROM ${tableName} 
        WHERE ${columnName} = $1 
          AND user_id = $2 
          AND membership_is_active = true 
          AND deleted_at IS NULL
    `;
    const directResult = await tenantPool.query(directQuery, [entityId, userId]);
    currentRole = directResult.rows[0]?.role || null;

    if (currentRole && allowedRoles.includes(currentRole)) {
        // is_private kontrolü
        if (checkPrivate && privateAllowedRoles.length > 0) {
            const entityTable = tableName.replace('_memberships', 's');
            const isPrivate = await isEntityPrivate(entityTable, columnName, entityId);
            if (isPrivate && !privateAllowedRoles.includes(currentRole)) {
                log.warn('Authorization denied (private entity)', { userId, entityId, currentRole });
                throw new AppError(errorCode, `This action requires higher privileges on private ${entityTable}.`);
            }
        }
        return;
    }

    // 2. Hiyerarşik yetki kontrolü
    if (checkOrgHierarchy) {
        const entityTable = tableName.replace('_memberships', 's');
        const orgId = await getEntityOrgId(entityTable, columnName, entityId);
        if (orgId && await isOrgOwnerOrAdmin(userId, orgId)) {
            log.info('Authorization granted via org hierarchy', { userId, entityId, orgId });
            return;
        }
    }

    // 3. Yetki yok
    log.warn('Authorization denied', {
        userId,
        entity: `${tableName}/${entityId}`,
        requiredRoles: allowedRoles,
        currentRole: currentRole || 'none',
    });

    const message = getDeniedMessage(errorMessage, currentRole || 'none', allowedRoles);
    throw new AppError(errorCode, message);
};

// ==================== ORGANIZATION YETKİ KONTROLLERİ ====================

export const requireOrgOwner = (userId: string, orgId: string) =>
    enforcePermission('organization_memberships', 'org_id', orgId, userId,
        [OrgRole.OWNER],
        ErrorCodes.ORG_OWNER_REQUIRED,
        'Only organization owner can perform this action'
    );

export const requireOrgAdminOrOwner = (userId: string, orgId: string) =>
    enforcePermission('organization_memberships', 'org_id', orgId, userId,
        [OrgRole.OWNER, OrgRole.ADMIN],
        ErrorCodes.ORG_PERMISSION_DENIED,
        'Organization admin or owner role required'
    );

export const requireOrgMember = (userId: string, orgId: string) =>
    enforcePermission('organization_memberships', 'org_id', orgId, userId,
        [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER],
        ErrorCodes.ORG_PERMISSION_DENIED,
        'You must be a member of this organization'
    );

// ==================== SITE YETKİ KONTROLLERİ ====================

export const requireSiteAdmin = (userId: string, siteId: string) =>
    enforcePermission('site_memberships', 'site_id', siteId, userId,
        [SiteRole.ADMIN],
        ErrorCodes.SITE_ADMIN_REQUIRED,
        'Only site admin can perform this action',
        true
    );

export const requireSiteMember = (userId: string, siteId: string) =>
    enforcePermission('site_memberships', 'site_id', siteId, userId,
        [SiteRole.ADMIN, SiteRole.CONTRIBUTOR, SiteRole.VIEWER],
        ErrorCodes.SITE_PERMISSION_DENIED,
        'You must be a member of this site',
        true
    );

export const requireSiteContributorOrAdmin = (userId: string, siteId: string) =>
    enforcePermission('site_memberships', 'site_id', siteId, userId,
        [SiteRole.ADMIN, SiteRole.CONTRIBUTOR],
        ErrorCodes.SITE_PERMISSION_DENIED,
        'Only site admin or contributor can perform this action',
        true
    );

// ==================== PROJECT YETKİ KONTROLLERİ ====================

export const requireProjectAdmin = (userId: string, projectId: string) =>
    enforcePermission('project_memberships', 'project_id', projectId, userId,
        [ProjectRole.ADMIN],
        ErrorCodes.PROJECT_ADMIN_REQUIRED,
        'Only project admin can perform this action',
        true
    );

export const requireProjectMember = (userId: string, projectId: string) =>
    enforcePermission('project_memberships', 'project_id', projectId, userId,
        [ProjectRole.ADMIN, ProjectRole.CONTRIBUTOR, ProjectRole.REVIEWER, ProjectRole.VIEWER],
        ErrorCodes.PROJECT_PERMISSION_DENIED,
        'You must be a member of this project',
        true
    );

export const requireProjectContributorOrAdmin = (userId: string, projectId: string) =>
    enforcePermission('project_memberships', 'project_id', projectId, userId,
        [ProjectRole.ADMIN, ProjectRole.CONTRIBUTOR],
        ErrorCodes.PROJECT_PERMISSION_DENIED,
        'Only project admin or contributor can perform this action',
        true
    );

// ==================== ISSUE YETKİ KONTROLLERİ ====================

export const requireIssueContributor = (userId: string, issueId: string) =>
    enforcePermission('issue_memberships', 'issue_id', issueId, userId,
        [IssueRole.CONTRIBUTOR],
        ErrorCodes.ISSUE_PERMISSION_DENIED,
        'Only issue contributor can perform this action',
        true
    );

export const requireIssueParticipant = (userId: string, issueId: string) =>
    enforcePermission('issue_memberships', 'issue_id', issueId, userId,
        [IssueRole.CONTRIBUTOR, IssueRole.REVIEWER, IssueRole.WATCHER],
        ErrorCodes.ISSUE_PERMISSION_DENIED,
        'You must be a participant of this issue',
        true
    );

export const requireIssueAdmin = (userId: string, issueId: string) =>
    enforcePermission('issue_memberships', 'issue_id', issueId, userId,
        [], // Doğrudan üyelik aranmaz, hiyerarşi yeterli
        ErrorCodes.ISSUE_PERMISSION_DENIED,
        'Only project admin, site admin, or org owner can perform this action',
        true
    );

// ==================== ÖZEL KONTROLLER ====================

export const isIssueAssignee = async (userId: string, issueId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        'SELECT 1 FROM issues WHERE issue_id = $1 AND assignee_id = $2 AND deleted_at IS NULL',
        [issueId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

export const isIssueReporter = async (userId: string, issueId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        'SELECT 1 FROM issues WHERE issue_id = $1 AND reporter_id = $2 AND deleted_at IS NULL',
        [issueId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};