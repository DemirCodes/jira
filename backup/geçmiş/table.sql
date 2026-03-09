-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM ('super_admin','support_admin','billing_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bug_status AS ENUM ('open','acknowledged','investigating','fixed','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM ('tenant_user','platform_user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('owner','admin','member','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_role AS ENUM ('project_admin','contributor','reviewer','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_role AS ENUM ('contributor','reviewer','watcher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('active','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM ('open','in_progress','in_review','fixed','rejected','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('file','image');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE site_status AS ENUM ('active','archived','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- PLATFORM TABLES
-- =====================================================

CREATE TABLE platform_users (
  platform_user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            citext UNIQUE NOT NULL,
  password_hash    text NOT NULL,
  role             platform_role NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  deleted_by       uuid REFERENCES platform_users(platform_user_id) ON DELETE SET NULL
);

CREATE TABLE system_audit_logs (
  audit_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type    actor_type NOT NULL,
  actor_id      uuid NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  action_type   text NOT NULL,
  old_value     jsonb,
  new_value     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- GLOBAL USERS
-- =====================================================

CREATE TABLE users (
  user_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name            text NOT NULL,
  user_last_name       text,
  user_display_name    text,
  user_email           citext UNIQUE NOT NULL,
  user_password        text NOT NULL,
  user_is_active       boolean NOT NULL DEFAULT true,
  last_login_at        timestamptz,
  user_friendship_code uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  metadata             jsonb DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES users(user_id) ON DELETE SET NULL
);

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

CREATE TABLE organizations (
  org_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_check_id    text UNIQUE NOT NULL,
  org_name        text NOT NULL,
  org_description text,
  slug            text UNIQUE NOT NULL,
  org_status      text NOT NULL DEFAULT 'active',
  created_by      uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE organization_memberships (
  org_membership_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role                 org_role NOT NULL,
  invited_by           uuid REFERENCES users(user_id) ON DELETE SET NULL,
  membership_is_active boolean NOT NULL DEFAULT true,
  joined_at            timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (org_id, user_id)
);

-- =====================================================
-- SITES
-- =====================================================

CREATE TABLE sites (
  site_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  site_name   text NOT NULL,
  site_slug   text NOT NULL,
  site_status site_status NOT NULL DEFAULT 'active',
  created_by  uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (org_id, site_slug)
);

-- =====================================================
-- PROJECTS
-- =====================================================

CREATE TABLE projects (
  project_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
  project_check_id    text UNIQUE NOT NULL,
  project_name        text NOT NULL,
  project_description text,
  slug                text,
  project_status      project_status NOT NULL DEFAULT 'active',
  created_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  completed_at        timestamptz,
  completed_by        uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (site_id, project_name)
);

CREATE TABLE project_memberships (
  project_membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role                  project_role NOT NULL,
  invited_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  membership_is_active  boolean NOT NULL DEFAULT true,
  joined_at             timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  deleted_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (project_id, user_id)
);

-- =====================================================
-- PROJECT REQUIREMENTS
-- =====================================================

CREATE TABLE project_requirements (
  requirement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  priority       priority_level DEFAULT 'medium',
  is_done        boolean NOT NULL DEFAULT false,
  created_by     uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  done_by        uuid REFERENCES users(user_id) ON DELETE SET NULL,
  done_at        timestamptz,
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES users(user_id) ON DELETE SET NULL
);

-- =====================================================
-- ISSUES
-- =====================================================

CREATE TABLE issues (
  issue_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  issue_no          bigint NOT NULL,
  issue_title       text NOT NULL,
  issue_description text,
  status            issue_status NOT NULL DEFAULT 'open',
  priority          priority_level DEFAULT 'medium',
  reporter_id       uuid REFERENCES users(user_id) ON DELETE SET NULL,
  assignee_id       uuid REFERENCES users(user_id) ON DELETE SET NULL,
  parent_issue_id   uuid REFERENCES issues(issue_id) ON DELETE SET NULL,
  blocking_issue_id uuid REFERENCES issues(issue_id) ON DELETE SET NULL,
  issue_is_active   boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (project_id, issue_no)
);

-- =====================================================
-- ISSUE MEMBERSHIPS
-- =====================================================

CREATE TABLE issue_memberships (
  issue_membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id            uuid NOT NULL REFERENCES issues(issue_id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role                issue_role NOT NULL,
  membership_is_active boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES users(user_id) ON DELETE SET NULL
);

-- =====================================================
-- ASSETS
-- =====================================================

CREATE TABLE organization_assets (
  org_asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  uploaded_by  uuid REFERENCES users(user_id) ON DELETE SET NULL,
  asset_type   asset_type NOT NULL,
  file_name    text NOT NULL,
  mime_type    text,
  byte_size    bigint,
  storage_key  text NOT NULL,
  checksum     text,
  metadata     jsonb DEFAULT '{}'::jsonb,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  deleted_by   uuid REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE project_assets (
  project_asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  uploaded_by      uuid REFERENCES users(user_id) ON DELETE SET NULL,
  asset_type       asset_type NOT NULL,
  file_name        text NOT NULL,
  mime_type        text,
  byte_size        bigint,
  storage_key      text NOT NULL,
  checksum         text,
  metadata         jsonb DEFAULT '{}'::jsonb,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  deleted_by       uuid REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE issue_assets (
  issue_asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id       uuid NOT NULL REFERENCES issues(issue_id) ON DELETE CASCADE,
  uploaded_by    uuid REFERENCES users(user_id) ON DELETE SET NULL,
  asset_type     asset_type NOT NULL,
  file_name      text NOT NULL,
  mime_type      text,
  byte_size      bigint,
  storage_key    text NOT NULL,
  checksum       text,
  metadata       jsonb DEFAULT '{}'::jsonb,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES users(user_id) ON DELETE SET NULL
);

-- =====================================================
-- APPLICATION BUGS
-- =====================================================

CREATE TABLE application_bugs (
  bug_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by uuid NOT NULL REFERENCES users(user_id),
  org_id      uuid REFERENCES organizations(org_id) ON DELETE SET NULL,
  project_id  uuid REFERENCES projects(project_id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text NOT NULL,
  status      bug_status NOT NULL DEFAULT 'open',
  priority    priority_level DEFAULT 'medium',
  assigned_to uuid REFERENCES platform_users(platform_user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES platform_users(platform_user_id) ON DELETE SET NULL
);