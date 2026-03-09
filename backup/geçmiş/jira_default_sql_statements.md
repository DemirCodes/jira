BEGIN;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================
-- ENUM TYPES
-- =========================

DO $$ BEGIN
    CREATE TYPE entity_status AS ENUM ('active','inactive','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE issue_type AS ENUM ('task','bug','story','epic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE issue_priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =========================
-- ORGANIZATIONS
-- =========================

CREATE TABLE IF NOT EXISTS organizations (
    org_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug citext NOT NULL UNIQUE,

    status entity_status NOT NULL DEFAULT 'active',
    status_changed_at timestamptz,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    deleted_at timestamptz
);

-- =========================
-- USERS
-- =========================

CREATE TABLE IF NOT EXISTS users (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(org_id),

    email citext NOT NULL,
    display_name text NOT NULL,
    password_hash text NOT NULL,

    status entity_status NOT NULL DEFAULT 'active',
    status_changed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    deleted_at timestamptz,

    CONSTRAINT uq_user_email UNIQUE (org_id, email)
);

-- =========================
-- PROJECTS
-- =========================

CREATE TABLE IF NOT EXISTS projects (
    project_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(org_id),

    name text NOT NULL,
    key citext NOT NULL,

    status entity_status NOT NULL DEFAULT 'active',
    status_changed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    deleted_at timestamptz,

    CONSTRAINT uq_project_key UNIQUE (org_id, key)
);

-- =========================
-- ISSUES
-- =========================

CREATE TABLE IF NOT EXISTS issues (
    issue_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(project_id),
    reporter_id uuid NOT NULL REFERENCES users(user_id),

    title text NOT NULL,
    description text,

    type issue_type NOT NULL DEFAULT 'task',
    priority issue_priority NOT NULL DEFAULT 'medium',

    status entity_status NOT NULL DEFAULT 'active',
    status_changed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    deleted_at timestamptz
);

-- =========================
-- COMMENTS
-- =========================

CREATE TABLE IF NOT EXISTS comments (
    comment_id bigserial PRIMARY KEY,
    issue_id uuid NOT NULL REFERENCES issues(issue_id),
    author_id uuid NOT NULL REFERENCES users(user_id),

    body text NOT NULL,

    status entity_status NOT NULL DEFAULT 'active',
    status_changed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    deleted_at timestamptz
);

-- =========================
-- GENERIC UPDATE TRIGGER
-- =========================

CREATE OR REPLACE FUNCTION trg_set_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- status değiştiyse
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_changed_at := now();
    END IF;

    -- her update'te updated_at güncellensin
    NEW.updated_at := now();

    RETURN NEW;
END;
$$;

-- Apply to tables
CREATE TRIGGER trg_org_update
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION trg_set_timestamps();

CREATE TRIGGER trg_user_update
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_set_timestamps();

CREATE TRIGGER trg_project_update
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION trg_set_timestamps();

CREATE TRIGGER trg_issue_update
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION trg_set_timestamps();

CREATE TRIGGER trg_comment_update
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION trg_set_timestamps();


-- =========================
-- PREVENT HARD DELETE
-- =========================

CREATE OR REPLACE FUNCTION prevent_physical_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Physical DELETE is not allowed. Use soft delete (set deleted_at).';
END;
$$;

CREATE TRIGGER trg_no_delete_org
BEFORE DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete();

CREATE TRIGGER trg_no_delete_user
BEFORE DELETE ON users
FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete();

CREATE TRIGGER trg_no_delete_project
BEFORE DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete();

CREATE TRIGGER trg_no_delete_issue
BEFORE DELETE ON issues
FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete();

CREATE TRIGGER trg_no_delete_comment
BEFORE DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete();

COMMIT;

