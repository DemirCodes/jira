"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIssueReporter = exports.isIssueAssignee = exports.requireIssueAdmin = exports.requireIssueParticipant = exports.requireIssueContributor = exports.requireProjectContributorOrAdmin = exports.requireProjectMember = exports.requireProjectAdmin = exports.requireSiteAssetUploadPermission = exports.requireSiteInvitePermission = exports.requireSiteAdminOrOrgOwner = exports.requireSiteContributorOrAdmin = exports.requireSiteMember = exports.requireSiteAdmin = exports.requireOrgMember = exports.requireOrgAdminOrOwner = exports.requireOrgOwner = exports.IssueRole = exports.ProjectRole = exports.SiteRole = exports.OrgRole = void 0;
const tenantPool_1 = require("../db/tenantPool");
const errorCodes_1 = require("../utils/errorCodes");
const logger_1 = require("../utils/logger");
// ==================== ENUMS (Rol Tanımlamaları) ====================
var OrgRole;
(function (OrgRole) {
    OrgRole["OWNER"] = "owner";
    OrgRole["ADMIN"] = "admin";
    OrgRole["MEMBER"] = "member";
    OrgRole["VIEWER"] = "viewer";
})(OrgRole || (exports.OrgRole = OrgRole = {}));
var SiteRole;
(function (SiteRole) {
    SiteRole["ADMIN"] = "admin";
    SiteRole["CONTRIBUTOR"] = "contrubitor";
    SiteRole["VIEWER"] = "viewer";
})(SiteRole || (exports.SiteRole = SiteRole = {}));
var ProjectRole;
(function (ProjectRole) {
    ProjectRole["ADMIN"] = "project_admin";
    ProjectRole["CONTRIBUTOR"] = "contributor";
    ProjectRole["REVIEWER"] = "reviewer";
    ProjectRole["VIEWER"] = "viewer";
})(ProjectRole || (exports.ProjectRole = ProjectRole = {}));
var IssueRole;
(function (IssueRole) {
    IssueRole["CONTRIBUTOR"] = "contributor";
    IssueRole["REVIEWER"] = "reviewer";
    IssueRole["WATCHER"] = "watcher";
})(IssueRole || (exports.IssueRole = IssueRole = {}));
// ==================== YARDIMCI FONKSİYONLAR ====================
const isOrgOwnerOrAdmin = async (userId, orgId) => {
    const result = await tenantPool_1.tenantPool.query(`SELECT 1 FROM organization_memberships 
         WHERE org_id = $1 
           AND user_id = $2 
           AND role IN ('owner', 'admin')
           AND membership_is_active = true 
           AND deleted_at IS NULL`, [orgId, userId]);
    return (result.rowCount ?? 0) > 0;
};
const getEntityOrgId = async (tableName, columnName, entityId) => {
    let query = '';
    if (tableName === 'projects') {
        query = `SELECT s.org_id FROM projects p JOIN sites s ON s.site_id = p.site_id WHERE p.${columnName} = $1`;
    }
    else if (tableName === 'sites') {
        query = `SELECT org_id FROM sites WHERE ${columnName} = $1`;
    }
    else if (tableName === 'issues') {
        query = `SELECT s.org_id FROM issues i JOIN projects p ON p.project_id = i.project_id JOIN sites s ON s.site_id = p.site_id WHERE i.${columnName} = $1`;
    }
    if (!query)
        return null;
    const result = await tenantPool_1.tenantPool.query(query, [entityId]);
    return result.rows[0]?.org_id || null;
};
const isEntityPrivate = async (tableName, columnName, entityId) => {
    const result = await tenantPool_1.tenantPool.query(`SELECT is_private FROM ${tableName} WHERE ${columnName} = $1 AND deleted_at IS NULL`, [entityId]);
    return result.rows[0]?.is_private || false;
};
const getDeniedMessage = (baseMessage, currentRole, allowedRoles) => {
    if (process.env.NODE_ENV === 'production') {
        return 'You do not have sufficient permissions to perform this action.';
    }
    return `${baseMessage}. Your current role is '${currentRole}'. Required: ${allowedRoles.join(' or ')}.`;
};
// ==================== MERKEZİ YETKİ KONTROL MOTORU ====================
const enforcePermission = async (tableName, columnName, entityId, userId, allowedRoles, errorCode, errorMessage, checkOrgHierarchy = false, checkPrivate = false, privateAllowedRoles = []) => {
    let currentRole = null;
    // 1. Doğrudan üyelik kontrolü
    const directQuery = `
        SELECT role FROM ${tableName} 
        WHERE ${columnName} = $1 
          AND user_id = $2 
          AND membership_is_active = true 
          AND deleted_at IS NULL
    `;
    const directResult = await tenantPool_1.tenantPool.query(directQuery, [entityId, userId]);
    currentRole = directResult.rows[0]?.role || null;
    if (currentRole && allowedRoles.includes(currentRole)) {
        // is_private kontrolü
        if (checkPrivate && privateAllowedRoles.length > 0) {
            const entityTable = tableName.replace('_memberships', 's');
            const isPrivate = await isEntityPrivate(entityTable, columnName, entityId);
            if (isPrivate && !privateAllowedRoles.includes(currentRole)) {
                logger_1.log.warn('Authorization denied (private entity)', { userId, entityId, currentRole });
                throw new errorCodes_1.AppError(errorCode, `This action requires higher privileges on private ${entityTable}.`);
            }
        }
        return;
    }
    // 2. Hiyerarşik yetki kontrolü
    if (checkOrgHierarchy) {
        const entityTable = tableName.replace('_memberships', 's');
        const orgId = await getEntityOrgId(entityTable, columnName, entityId);
        if (orgId && await isOrgOwnerOrAdmin(userId, orgId)) {
            logger_1.log.info('Authorization granted via org hierarchy', { userId, entityId, orgId });
            return;
        }
    }
    // 3. Yetki yok
    logger_1.log.warn('Authorization denied', {
        userId,
        entity: `${tableName}/${entityId}`,
        requiredRoles: allowedRoles,
        currentRole: currentRole || 'none',
    });
    const message = getDeniedMessage(errorMessage, currentRole || 'none', allowedRoles);
    throw new errorCodes_1.AppError(errorCode, message);
};
// ==================== ORGANIZATION YETKİ KONTROLLERİ ====================
const requireOrgOwner = (userId, orgId) => enforcePermission('organization_memberships', 'org_id', orgId, userId, [OrgRole.OWNER], errorCodes_1.ErrorCodes.ORG_OWNER_REQUIRED, 'Only organization owner can perform this action');
exports.requireOrgOwner = requireOrgOwner;
const requireOrgAdminOrOwner = (userId, orgId) => enforcePermission('organization_memberships', 'org_id', orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN], errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'Organization admin or owner role required');
exports.requireOrgAdminOrOwner = requireOrgAdminOrOwner;
const requireOrgMember = (userId, orgId) => enforcePermission('organization_memberships', 'org_id', orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER], errorCodes_1.ErrorCodes.ORG_PERMISSION_DENIED, 'You must be a member of this organization');
exports.requireOrgMember = requireOrgMember;
const getOrganizationRole = async (userId, orgId) => {
    const result = await tenantPool_1.tenantPool.query(`SELECT role FROM organization_memberships 
         WHERE org_id = $1 AND user_id = $2 AND membership_is_active = true AND deleted_at IS NULL`, [orgId, userId]);
    return result.rows[0]?.role || null;
};
// ==================== SITE YETKİ KONTROLLERİ ====================
const getSiteRole = async (userId, siteId) => {
    const result = await tenantPool_1.tenantPool.query(`SELECT role FROM site_memberships 
         WHERE site_id = $1 AND user_id = $2 AND membership_is_active = true AND deleted_at IS NULL`, [siteId, userId]);
    return result.rows[0]?.role || null;
};
const getSiteOrgId = async (siteId) => {
    const result = await tenantPool_1.tenantPool.query('SELECT org_id FROM sites WHERE site_id = $1 AND deleted_at IS NULL', [siteId]);
    return result.rows[0]?.org_id || null;
};
const requireSiteAdmin = (userId, siteId) => enforcePermission('site_memberships', 'site_id', siteId, userId, [SiteRole.ADMIN], errorCodes_1.ErrorCodes.SITE_ADMIN_REQUIRED, 'Only site admin can perform this action', true);
exports.requireSiteAdmin = requireSiteAdmin;
const requireSiteMember = (userId, siteId) => enforcePermission('site_memberships', 'site_id', siteId, userId, [SiteRole.ADMIN, SiteRole.CONTRIBUTOR, SiteRole.VIEWER], errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'You must be a member of this site', true);
exports.requireSiteMember = requireSiteMember;
const requireSiteContributorOrAdmin = (userId, siteId) => enforcePermission('site_memberships', 'site_id', siteId, userId, [SiteRole.ADMIN, SiteRole.CONTRIBUTOR], errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'Only site admin or contributor can perform this action', true);
exports.requireSiteContributorOrAdmin = requireSiteContributorOrAdmin;
// Site admin veya org owner (her şeyi yapabilir)
const requireSiteAdminOrOrgOwner = async (userId, siteId) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin')
        return;
    const orgId = await getSiteOrgId(siteId);
    if (orgId && await isOrgOwnerOrAdmin(userId, orgId))
        return;
    throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'Only site admin or organization owner can perform this action');
};
exports.requireSiteAdminOrOrgOwner = requireSiteAdminOrOrgOwner;
// Site'ye davet etme yetkisi (is_private kontrolü dahil)
const requireSiteInvitePermission = async (userId, siteId) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin')
        return;
    const orgId = await getSiteOrgId(siteId);
    if (!orgId)
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_NOT_FOUND);
    const orgRole = await getOrganizationRole(userId, orgId);
    if (orgRole === 'owner')
        return;
    if (orgRole === 'admin') {
        const isPrivate = await isEntityPrivate('sites', 'site_id', siteId);
        if (!isPrivate)
            return;
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PRIVATE_CANNOT_INVITE, 'Org admin cannot invite users to private sites');
    }
    throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'Only org owner, org admin (public sites), or site admin can invite');
};
exports.requireSiteInvitePermission = requireSiteInvitePermission;
// Site asset yükleme yetkisi
const requireSiteAssetUploadPermission = async (userId, siteId) => {
    const siteRole = await getSiteRole(userId, siteId);
    if (siteRole === 'admin' || siteRole === 'contrubitor')
        return;
    const orgId = await getSiteOrgId(siteId);
    if (!orgId)
        throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_NOT_FOUND);
    const orgRole = await getOrganizationRole(userId, orgId);
    if (orgRole === 'owner')
        return;
    if (orgRole === 'admin') {
        const isPrivate = await isEntityPrivate('sites', 'site_id', siteId);
        if (!isPrivate)
            return;
    }
    throw new errorCodes_1.AppError(errorCodes_1.ErrorCodes.SITE_PERMISSION_DENIED, 'Only site admin, contributor, or org owner can upload assets');
};
exports.requireSiteAssetUploadPermission = requireSiteAssetUploadPermission;
// ==================== PROJECT YETKİ KONTROLLERİ ====================
const requireProjectAdmin = (userId, projectId) => enforcePermission('project_memberships', 'project_id', projectId, userId, [ProjectRole.ADMIN], errorCodes_1.ErrorCodes.PROJECT_ADMIN_REQUIRED, 'Only project admin can perform this action', true);
exports.requireProjectAdmin = requireProjectAdmin;
const requireProjectMember = (userId, projectId) => enforcePermission('project_memberships', 'project_id', projectId, userId, [ProjectRole.ADMIN, ProjectRole.CONTRIBUTOR, ProjectRole.REVIEWER, ProjectRole.VIEWER], errorCodes_1.ErrorCodes.PROJECT_PERMISSION_DENIED, 'You must be a member of this project', true);
exports.requireProjectMember = requireProjectMember;
const requireProjectContributorOrAdmin = (userId, projectId) => enforcePermission('project_memberships', 'project_id', projectId, userId, [ProjectRole.ADMIN, ProjectRole.CONTRIBUTOR], errorCodes_1.ErrorCodes.PROJECT_PERMISSION_DENIED, 'Only project admin or contributor can perform this action', true);
exports.requireProjectContributorOrAdmin = requireProjectContributorOrAdmin;
// ==================== ISSUE YETKİ KONTROLLERİ ====================
const requireIssueContributor = (userId, issueId) => enforcePermission('issue_memberships', 'issue_id', issueId, userId, [IssueRole.CONTRIBUTOR], errorCodes_1.ErrorCodes.ISSUE_PERMISSION_DENIED, 'Only issue contributor can perform this action', true);
exports.requireIssueContributor = requireIssueContributor;
const requireIssueParticipant = (userId, issueId) => enforcePermission('issue_memberships', 'issue_id', issueId, userId, [IssueRole.CONTRIBUTOR, IssueRole.REVIEWER, IssueRole.WATCHER], errorCodes_1.ErrorCodes.ISSUE_PERMISSION_DENIED, 'You must be a participant of this issue', true);
exports.requireIssueParticipant = requireIssueParticipant;
const requireIssueAdmin = (userId, issueId) => enforcePermission('issue_memberships', 'issue_id', issueId, userId, [], // Doğrudan üyelik aranmaz, hiyerarşi yeterli
errorCodes_1.ErrorCodes.ISSUE_PERMISSION_DENIED, 'Only project admin, site admin, or org owner can perform this action', true);
exports.requireIssueAdmin = requireIssueAdmin;
// ==================== ÖZEL KONTROLLER ====================
const isIssueAssignee = async (userId, issueId) => {
    const result = await tenantPool_1.tenantPool.query('SELECT 1 FROM issues WHERE issue_id = $1 AND assignee_id = $2 AND deleted_at IS NULL', [issueId, userId]);
    return (result.rowCount ?? 0) > 0;
};
exports.isIssueAssignee = isIssueAssignee;
const isIssueReporter = async (userId, issueId) => {
    const result = await tenantPool_1.tenantPool.query('SELECT 1 FROM issues WHERE issue_id = $1 AND reporter_id = $2 AND deleted_at IS NULL', [issueId, userId]);
    return (result.rowCount ?? 0) > 0;
};
exports.isIssueReporter = isIssueReporter;
//# sourceMappingURL=authorization.service.js.map