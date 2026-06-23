CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('tenant_user', 'platform_user');

-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('file', 'image');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('U', 'I', 'D');

-- CreateEnum
CREATE TYPE "bug_status" AS ENUM ('open', 'acknowledged', 'investigating', 'fixed', 'rejected');

-- CreateEnum
CREATE TYPE "issue_priority" AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');

-- CreateEnum
CREATE TYPE "issue_role" AS ENUM ('contributor', 'reviewer', 'watcher');

-- CreateEnum
CREATE TYPE "issue_status" AS ENUM ('open', 'in_progress', 'in_review', 'fixed', 'rejected', 'closed');

-- CreateEnum
CREATE TYPE "issue_type" AS ENUM ('task', 'bug', 'story', 'epic');

-- CreateEnum
CREATE TYPE "org_role" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "org_status" AS ENUM ('active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "platform_role" AS ENUM ('super_admin', 'support_admin', 'billing_admin');

-- CreateEnum
CREATE TYPE "priority_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "project_role" AS ENUM ('project_admin', 'contributor', 'reviewer', 'viewer');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "site_role" AS ENUM ('admin', 'contributor', 'viewer');

-- CreateEnum
CREATE TYPE "site_status" AS ENUM ('active', 'archived', 'suspended');

-- CreateTable
CREATE TABLE "application_bugs" (
    "bug_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reported_by" UUID NOT NULL,
    "org_id" UUID,
    "project_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "bug_status" NOT NULL DEFAULT 'open',
    "priority" "priority_level" DEFAULT 'medium',
    "assigned_to" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "application_bugs_pkey" PRIMARY KEY ("bug_id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "invitation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "invited_user_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) DEFAULT (now() + '7 days'::interval),
    "accepted_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateTable
CREATE TABLE "issue_activity" (
    "activity_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "user_id" UUID,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "issue_assets" (
    "issue_asset_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "asset_type" "asset_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "issue_assets_pkey" PRIMARY KEY ("issue_asset_id")
);

-- CreateTable
CREATE TABLE "issue_memberships" (
    "issue_membership_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "issue_role" NOT NULL,
    "membership_is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "issue_memberships_pkey" PRIMARY KEY ("issue_membership_id")
);

-- CreateTable
CREATE TABLE "issues" (
    "issue_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "issue_no" BIGINT NOT NULL,
    "issue_title" TEXT NOT NULL,
    "issue_description" TEXT,
    "status" "issue_status" NOT NULL DEFAULT 'open',
    "priority" "priority_level" DEFAULT 'medium',
    "reporter_id" UUID,
    "assignee_id" UUID,
    "parent_issue_id" UUID,
    "blocking_issue_id" UUID,
    "issue_is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_editable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "organization_assets" (
    "org_asset_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "asset_type" "asset_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "organization_assets_pkey" PRIMARY KEY ("org_asset_id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "org_membership_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "org_role" NOT NULL DEFAULT 'viewer',
    "invited_by" UUID,
    "membership_is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("org_membership_id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "org_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_check_id" TEXT NOT NULL,
    "org_name" TEXT NOT NULL,
    "org_description" TEXT,
    "slug" TEXT NOT NULL,
    "org_status" TEXT NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "project_assets" (
    "project_asset_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "asset_type" "asset_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("project_asset_id")
);

-- CreateTable
CREATE TABLE "project_memberships" (
    "project_membership_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "project_role" NOT NULL,
    "invited_by" UUID,
    "membership_is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "project_memberships_pkey" PRIMARY KEY ("project_membership_id")
);

-- CreateTable
CREATE TABLE "project_requirements" (
    "requirement_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "priority_level" DEFAULT 'medium',
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "done_by" UUID,
    "done_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "project_requirements_pkey" PRIMARY KEY ("requirement_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "project_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "project_check_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_description" TEXT,
    "slug" TEXT,
    "project_status" "project_status" NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "completed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "is_private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "project_issue_counters" (
    "project_id" UUID NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_issue_counters_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "site_assets" (
    "site_asset_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "asset_type" "asset_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "site_assets_pkey" PRIMARY KEY ("site_asset_id")
);

-- CreateTable
CREATE TABLE "site_memberships" (
    "site_membership_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "site_role" NOT NULL,
    "invited_by" UUID,
    "membership_is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "site_memberships_pkey" PRIMARY KEY ("site_membership_id")
);

-- CreateTable
CREATE TABLE "sites" (
    "site_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "site_name" TEXT NOT NULL,
    "site_slug" TEXT NOT NULL,
    "site_status" "site_status" NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "is_private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("site_id")
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "audit_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_type" "actor_type" NOT NULL,
    "actor_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_name" TEXT NOT NULL,
    "user_last_name" TEXT,
    "user_display_name" TEXT,
    "user_email" CITEXT NOT NULL,
    "user_password" TEXT NOT NULL,
    "user_is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "user_friendship_code" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "email_verified_at" TIMESTAMPTZ(6),
    "email_verification_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires_at" TIMESTAMPTZ(6),
    "two_factor_secret" TEXT,
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "last_password_change_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "token_version" INTEGER DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issues_project_id_issue_no_key" ON "issues"("project_id", "issue_no");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_org_id_user_id_key" ON "organization_memberships"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_org_check_id_key" ON "organizations"("org_check_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_memberships_project_id_user_id_key" ON "project_memberships"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_check_id_key" ON "projects"("project_check_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_site_id_project_name_key" ON "projects"("site_id", "project_name");

-- CreateIndex
CREATE UNIQUE INDEX "site_memberships_site_id_user_id_key" ON "site_memberships"("site_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sites_org_id_site_slug_key" ON "sites"("org_id", "site_slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_friendship_code_key" ON "users"("user_friendship_code");

-- AddForeignKey
ALTER TABLE "application_bugs" ADD CONSTRAINT "application_bugs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_bugs" ADD CONSTRAINT "application_bugs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_bugs" ADD CONSTRAINT "application_bugs_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("issue_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_assets" ADD CONSTRAINT "issue_assets_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_assets" ADD CONSTRAINT "issue_assets_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("issue_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_assets" ADD CONSTRAINT "issue_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_memberships" ADD CONSTRAINT "issue_memberships_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_memberships" ADD CONSTRAINT "issue_memberships_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("issue_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_memberships" ADD CONSTRAINT "issue_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_blocking_issue_id_fkey" FOREIGN KEY ("blocking_issue_id") REFERENCES "issues"("issue_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_parent_issue_id_fkey" FOREIGN KEY ("parent_issue_id") REFERENCES "issues"("issue_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_assets" ADD CONSTRAINT "organization_assets_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_assets" ADD CONSTRAINT "organization_assets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_assets" ADD CONSTRAINT "organization_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_requirements" ADD CONSTRAINT "project_requirements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_requirements" ADD CONSTRAINT "project_requirements_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_requirements" ADD CONSTRAINT "project_requirements_done_by_fkey" FOREIGN KEY ("done_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_requirements" ADD CONSTRAINT "project_requirements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_issue_counters" ADD CONSTRAINT "project_issue_counters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_memberships" ADD CONSTRAINT "site_memberships_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_memberships" ADD CONSTRAINT "site_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_memberships" ADD CONSTRAINT "site_memberships_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_memberships" ADD CONSTRAINT "site_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
