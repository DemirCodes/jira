
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.15.0
 * Query Engine version: 12e25d8d06f6ea5a0252864dd9a03b1bb51f3022
 */
Prisma.prismaVersion = {
  client: "5.15.0",
  engine: "12e25d8d06f6ea5a0252864dd9a03b1bb51f3022"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Application_bugsScalarFieldEnum = {
  bug_id: 'bug_id',
  reported_by: 'reported_by',
  org_id: 'org_id',
  project_id: 'project_id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  assigned_to: 'assigned_to',
  created_at: 'created_at',
  resolved_at: 'resolved_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.InvitationsScalarFieldEnum = {
  invitation_id: 'invitation_id',
  org_id: 'org_id',
  invited_by: 'invited_by',
  invited_user_id: 'invited_user_id',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  role: 'role',
  status: 'status',
  created_at: 'created_at',
  expires_at: 'expires_at',
  accepted_at: 'accepted_at',
  rejected_at: 'rejected_at',
  cancelled_at: 'cancelled_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Issue_activityScalarFieldEnum = {
  activity_id: 'activity_id',
  issue_id: 'issue_id',
  user_id: 'user_id',
  field_name: 'field_name',
  old_value: 'old_value',
  new_value: 'new_value',
  created_at: 'created_at'
};

exports.Prisma.Issue_assetsScalarFieldEnum = {
  issue_asset_id: 'issue_asset_id',
  issue_id: 'issue_id',
  uploaded_by: 'uploaded_by',
  asset_type: 'asset_type',
  file_name: 'file_name',
  mime_type: 'mime_type',
  byte_size: 'byte_size',
  storage_key: 'storage_key',
  checksum: 'checksum',
  metadata: 'metadata',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Issue_membershipsScalarFieldEnum = {
  issue_membership_id: 'issue_membership_id',
  issue_id: 'issue_id',
  user_id: 'user_id',
  role: 'role',
  membership_is_active: 'membership_is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.IssuesScalarFieldEnum = {
  issue_id: 'issue_id',
  project_id: 'project_id',
  issue_no: 'issue_no',
  issue_title: 'issue_title',
  issue_description: 'issue_description',
  status: 'status',
  priority: 'priority',
  reporter_id: 'reporter_id',
  assignee_id: 'assignee_id',
  parent_issue_id: 'parent_issue_id',
  blocking_issue_id: 'blocking_issue_id',
  issue_is_active: 'issue_is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by',
  is_private: 'is_private',
  is_editable: 'is_editable'
};

exports.Prisma.NotificationsScalarFieldEnum = {
  notification_id: 'notification_id',
  user_id: 'user_id',
  type: 'type',
  title: 'title',
  content: 'content',
  metadata: 'metadata',
  is_read: 'is_read',
  created_at: 'created_at',
  read_at: 'read_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Organization_assetsScalarFieldEnum = {
  org_asset_id: 'org_asset_id',
  org_id: 'org_id',
  uploaded_by: 'uploaded_by',
  asset_type: 'asset_type',
  file_name: 'file_name',
  mime_type: 'mime_type',
  byte_size: 'byte_size',
  storage_key: 'storage_key',
  checksum: 'checksum',
  metadata: 'metadata',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Organization_membershipsScalarFieldEnum = {
  org_membership_id: 'org_membership_id',
  org_id: 'org_id',
  user_id: 'user_id',
  role: 'role',
  invited_by: 'invited_by',
  membership_is_active: 'membership_is_active',
  joined_at: 'joined_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.OrganizationsScalarFieldEnum = {
  org_id: 'org_id',
  org_check_id: 'org_check_id',
  org_name: 'org_name',
  org_description: 'org_description',
  slug: 'slug',
  org_status: 'org_status',
  created_by: 'created_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Project_assetsScalarFieldEnum = {
  project_asset_id: 'project_asset_id',
  project_id: 'project_id',
  uploaded_by: 'uploaded_by',
  asset_type: 'asset_type',
  file_name: 'file_name',
  mime_type: 'mime_type',
  byte_size: 'byte_size',
  storage_key: 'storage_key',
  checksum: 'checksum',
  metadata: 'metadata',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Project_membershipsScalarFieldEnum = {
  project_membership_id: 'project_membership_id',
  project_id: 'project_id',
  user_id: 'user_id',
  role: 'role',
  invited_by: 'invited_by',
  membership_is_active: 'membership_is_active',
  joined_at: 'joined_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Project_requirementsScalarFieldEnum = {
  requirement_id: 'requirement_id',
  project_id: 'project_id',
  title: 'title',
  description: 'description',
  priority: 'priority',
  is_done: 'is_done',
  created_by: 'created_by',
  created_at: 'created_at',
  done_by: 'done_by',
  done_at: 'done_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.ProjectsScalarFieldEnum = {
  project_id: 'project_id',
  site_id: 'site_id',
  project_check_id: 'project_check_id',
  project_name: 'project_name',
  project_description: 'project_description',
  slug: 'slug',
  project_status: 'project_status',
  created_by: 'created_by',
  completed_at: 'completed_at',
  completed_by: 'completed_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by',
  is_private: 'is_private',
  project_key: 'project_key',
  board_type: 'board_type',
  icon_url: 'icon_url'
};

exports.Prisma.Project_issue_countersScalarFieldEnum = {
  project_id: 'project_id',
  last_value: 'last_value',
  updated_at: 'updated_at'
};

exports.Prisma.Site_assetsScalarFieldEnum = {
  site_asset_id: 'site_asset_id',
  site_id: 'site_id',
  uploaded_by: 'uploaded_by',
  asset_type: 'asset_type',
  file_name: 'file_name',
  mime_type: 'mime_type',
  byte_size: 'byte_size',
  storage_key: 'storage_key',
  checksum: 'checksum',
  metadata: 'metadata',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.Site_membershipsScalarFieldEnum = {
  site_membership_id: 'site_membership_id',
  site_id: 'site_id',
  user_id: 'user_id',
  role: 'role',
  invited_by: 'invited_by',
  membership_is_active: 'membership_is_active',
  joined_at: 'joined_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by'
};

exports.Prisma.SitesScalarFieldEnum = {
  site_id: 'site_id',
  org_id: 'org_id',
  site_name: 'site_name',
  site_slug: 'site_slug',
  site_status: 'site_status',
  created_by: 'created_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by',
  is_private: 'is_private'
};

exports.Prisma.System_audit_logsScalarFieldEnum = {
  audit_id: 'audit_id',
  actor_type: 'actor_type',
  actor_id: 'actor_id',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  action_type: 'action_type',
  old_value: 'old_value',
  new_value: 'new_value',
  created_at: 'created_at'
};

exports.Prisma.UsersScalarFieldEnum = {
  user_id: 'user_id',
  user_name: 'user_name',
  user_last_name: 'user_last_name',
  user_display_name: 'user_display_name',
  user_email: 'user_email',
  user_password: 'user_password',
  user_is_active: 'user_is_active',
  last_login_at: 'last_login_at',
  user_friendship_code: 'user_friendship_code',
  metadata: 'metadata',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  deleted_by: 'deleted_by',
  email_verified_at: 'email_verified_at',
  email_verification_token: 'email_verification_token',
  password_reset_token: 'password_reset_token',
  password_reset_expires_at: 'password_reset_expires_at',
  two_factor_secret: 'two_factor_secret',
  two_factor_enabled: 'two_factor_enabled',
  last_password_change_at: 'last_password_change_at',
  token_version: 'token_version'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.bug_status = exports.$Enums.bug_status = {
  open: 'open',
  acknowledged: 'acknowledged',
  investigating: 'investigating',
  fixed: 'fixed',
  rejected: 'rejected'
};

exports.priority_level = exports.$Enums.priority_level = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical'
};

exports.asset_type = exports.$Enums.asset_type = {
  file: 'file',
  image: 'image'
};

exports.issue_role = exports.$Enums.issue_role = {
  contributor: 'contributor',
  reviewer: 'reviewer',
  watcher: 'watcher'
};

exports.issue_status = exports.$Enums.issue_status = {
  open: 'open',
  in_progress: 'in_progress',
  in_review: 'in_review',
  fixed: 'fixed',
  rejected: 'rejected',
  closed: 'closed'
};

exports.org_role = exports.$Enums.org_role = {
  owner: 'owner',
  admin: 'admin',
  member: 'member',
  viewer: 'viewer'
};

exports.project_role = exports.$Enums.project_role = {
  project_admin: 'project_admin',
  contributor: 'contributor',
  reviewer: 'reviewer',
  viewer: 'viewer'
};

exports.project_status = exports.$Enums.project_status = {
  active: 'active',
  completed: 'completed',
  archived: 'archived'
};

exports.site_role = exports.$Enums.site_role = {
  admin: 'admin',
  contributor: 'contributor',
  viewer: 'viewer'
};

exports.site_status = exports.$Enums.site_status = {
  active: 'active',
  archived: 'archived',
  suspended: 'suspended'
};

exports.actor_type = exports.$Enums.actor_type = {
  tenant_user: 'tenant_user',
  platform_user: 'platform_user'
};

exports.Prisma.ModelName = {
  application_bugs: 'application_bugs',
  invitations: 'invitations',
  issue_activity: 'issue_activity',
  issue_assets: 'issue_assets',
  issue_memberships: 'issue_memberships',
  issues: 'issues',
  notifications: 'notifications',
  organization_assets: 'organization_assets',
  organization_memberships: 'organization_memberships',
  organizations: 'organizations',
  project_assets: 'project_assets',
  project_memberships: 'project_memberships',
  project_requirements: 'project_requirements',
  projects: 'projects',
  project_issue_counters: 'project_issue_counters',
  site_assets: 'site_assets',
  site_memberships: 'site_memberships',
  sites: 'sites',
  system_audit_logs: 'system_audit_logs',
  users: 'users'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
