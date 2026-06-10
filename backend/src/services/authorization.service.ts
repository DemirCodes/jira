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


// ORG OWNER SİTE İÇERİSİNDE ADMİN OLMASI GEREKMEKTE 
const isSiteAdmin = async (userId: string, siteId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        `SELECT 1 FROM site_memberships 
         WHERE site_id = $1 
           AND user_id = $2 
           AND role = 'admin'
           AND membership_is_active = true 
           AND deleted_at IS NULL`,
        [siteId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

const isProjectAdmin = async (userId: string, projectId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        `SELECT 1 FROM project_memberships 
         WHERE project_id = $1 
           AND user_id = $2 
           AND role = 'project_admin'
           AND membership_is_active = true 
           AND deleted_at IS NULL`,
        [projectId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

const isIssueAdmin = async (userId: string, issueId: string): Promise<boolean> => {
    const result = await tenantPool.query(
        `SELECT 1 FROM issue_memberships 
         WHERE issue_id = $1 
           AND user_id = $2 
           AND role = 'contributor' -- Issue admin rolü yok, contributor kabul ediliyor
           AND membership_is_active = true 
           AND deleted_at IS NULL`,
        [issueId, userId]
    );
    return (result.rowCount ?? 0) > 0;
}

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


// YENİ: Proje oluşturma yetkisi - Senin kuralın (Org Owner OR (Org Admin + Site Admin))
// Site Admin de kendi başına oluşturabilsin istiyorsan burayı genişletebiliriz.
export const checkProjectCreationPermission = async (userId: string, siteId: string): Promise<void> => {
    const siteOrgId = await getSiteOrgId(siteId);
    if (!siteOrgId) throw new AppError(ErrorCodes.SITE_NOT_FOUND);

    // 1. Org Owner mı?
    const orgRole = await getOrganizationRole(userId, siteOrgId);
    if (orgRole === OrgRole.OWNER) return;

    // 2. Site Admin mi?
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === SiteRole.ADMIN) return;

    // 3. Org Admin + Site Admin birleşimi mi?
    if (orgRole === OrgRole.ADMIN && siteRole === SiteRole.ADMIN) return;

    throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Permission denied: Insufficient privileges to create project');
};


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



const getOrganizationRole = async (userId: string, orgId: string): Promise<string | null> => {
    const result = await tenantPool.query(
        `SELECT role FROM organization_memberships 
         WHERE org_id = $1 AND user_id = $2 AND membership_is_active = true AND deleted_at IS NULL`,
        [orgId, userId]
    );
    return result.rows[0]?.role || null;
};
// ==================== SITE YETKİ KONTROLLERİ ====================

const getSiteRole = async (userId: string, siteId: string): Promise<string | null> => {
    const result = await tenantPool.query(
        `SELECT role FROM site_memberships 
         WHERE site_id = $1 AND user_id = $2 AND membership_is_active = true AND deleted_at IS NULL`,
        [siteId, userId]
    );
    return result.rows[0]?.role || null;
};

const getSiteOrgId = async (siteId: string): Promise<string | null> => {
    const result = await tenantPool.query(
        'SELECT org_id FROM sites WHERE site_id = $1 AND deleted_at IS NULL',
        [siteId]
    );
    return result.rows[0]?.org_id || null;
};


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

// Site admin veya org owner (her şeyi yapabilir)
export const requireSiteAdminOrOrgOwner = async (userId: string, siteId: string) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin') return;

    const orgId = await getSiteOrgId(siteId);
    if (orgId && await isOrgOwnerOrAdmin(userId, orgId)) return;

    throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED,
        'Only site admin or organization owner can perform this action');
};

// Site'ye davet etme yetkisi (is_private kontrolü dahil)
export const requireSiteInvitePermission = async (userId: string, siteId: string) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin') return;

    const orgId = await getSiteOrgId(siteId);
    if (!orgId) throw new AppError(ErrorCodes.SITE_NOT_FOUND);

    const orgRole = await getOrganizationRole(userId, orgId);
    if (orgRole === 'owner') return;

    if (orgRole === 'admin') {
        const isPrivate = await isEntityPrivate('sites', 'site_id', siteId);
        if (!isPrivate) return;
        throw new AppError(ErrorCodes.SITE_PRIVATE_CANNOT_INVITE,
            'Org admin cannot invite users to private sites');
    }

    throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED,
        'Only org owner, org admin (public sites), or site admin can invite');
};

// Site asset yükleme yetkisi
export const requireSiteAssetUploadPermission = async (userId: string, siteId: string) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin' || siteRole === 'contrubitor') return;

    const orgId = await getSiteOrgId(siteId);
    if (!orgId) throw new AppError(ErrorCodes.SITE_NOT_FOUND);

    const orgRole = await getOrganizationRole(userId, orgId);
    if (orgRole === 'owner') return;

    if (orgRole === 'admin') {
        const isPrivate = await isEntityPrivate('sites', 'site_id', siteId);
        if (!isPrivate) return;
    }

    throw new AppError(ErrorCodes.SITE_PERMISSION_DENIED,
        'Only site admin, contributor, or org owner can upload assets');
};
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

// ============================================================================
// YENİ: PROJECT AUTH & ACCESS POLICY (KATI KURALLAR)
// ============================================================================

export const ProjectAccessPolicy = {
    
    // 1. CREATE: [SiteAdmin]
    async validateCreation(userId: string, siteId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM site_memberships 
             WHERE site_id = $1 AND user_id = $2 AND role = 'admin' 
             AND membership_is_active = true AND deleted_at IS NULL`,
            [siteId, userId]
        );
        
        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Sadece Site Admin proje oluşturabilir.');
        }
    },

    // 2 & 3. READ (List & Get): [SiteMember]
    async validateRead(userId: string, siteId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM site_memberships 
             WHERE site_id = $1 AND user_id = $2 
             AND membership_is_active = true AND deleted_at IS NULL`,
            [siteId, userId]
        );

        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu siteye ve projelere erişiminiz yok.');
        }
    },

    // 4, 5, 6, 7. WRITE/MANAGE (Update, Delete, Restore, Invite): [ProjectAdmin]
    async validateManagement(userId: string, projectId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM project_memberships 
             WHERE project_id = $1 AND user_id = $2 AND role = 'project_admin'`,
            [projectId, userId]
        );

        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu işlem için Proje Admin yetkiniz olması gerekmektedir.');
        }
    }
};



// ============================================================================
// YENİ: ISSUE AUTH & ACCESS POLICY (KATI KURALLAR)
// ============================================================================

export const IssueAccessPolicy = {
    
    // 1. CREATE: [ProjectAdmin, Contributor] (DB ile senkron)
    async validateCreation(userId: string, projectId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM project_memberships 
             WHERE project_id = $1 AND user_id = $2 AND role IN ('project_admin', 'contributor') 
             AND membership_is_active = true AND deleted_at IS NULL`,
            [projectId, userId]
        );
        
        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Sadece Project Admin veya Contributor görev oluşturabilir.');
        }
    },

    // 2 & 3. READ (List & Get): [ProjectMember]
    async validateRead(userId: string, projectId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM project_memberships 
             WHERE project_id = $1 AND user_id = $2 
             AND membership_is_active = true AND deleted_at IS NULL`,
            [projectId, userId]
        );

        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu projenin görevlerine erişiminiz yok.');
        }
    },

    // 4. UPDATE & INVITE: [ProjectAdmin, Assignee, Reporter, Contributor]
    async validateUpdate(userId: string, projectId: string, issueId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM project_memberships WHERE project_id = $1 AND user_id = $2 AND role = 'project_admin' AND membership_is_active = true
             UNION
             SELECT 1 FROM issues WHERE issue_id = $3 AND (assignee_id = $2 OR reporter_id = $2) AND deleted_at IS NULL
             UNION
             SELECT 1 FROM issue_memberships WHERE issue_id = $3 AND user_id = $2 AND role = 'contributor' AND membership_is_active = true`,
            [projectId, userId, issueId]
        );

        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu görevi güncelleme veya atama yetkiniz yok.');
        }
    },

    // 5 & 6. DELETE & RESTORE: [SADECE ProjectAdmin]
    async validateManagement(userId: string, projectId: string): Promise<void> {
        const result = await tenantPool.query(
            `SELECT 1 FROM project_memberships 
             WHERE project_id = $1 AND user_id = $2 AND role = 'project_admin' 
             AND membership_is_active = true AND deleted_at IS NULL`,
            [projectId, userId]
        );

        if ((result.rowCount ?? 0) === 0) {
            throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Görev silme/kurtarma işlemleri için Proje Yöneticisi (Admin) olmanız gerekmektedir.');
        }
    }
};