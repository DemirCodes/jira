--
-- PostgreSQL database dump
--

\restrict x2JNAtqaNh4C0tb8kcmmyw2og610omq7dA2YTwCrc6G6ddB5pSmFc5yxOYNhdq1

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

-- Started on 2026-03-19 02:15:34 +03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 17237)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 2 (class 3079 OID 17200)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 970 (class 1247 OID 17484)
-- Name: actor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.actor_type AS ENUM (
    'tenant_user',
    'platform_user'
);


--
-- TOC entry 991 (class 1247 OID 17550)
-- Name: asset_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.asset_type AS ENUM (
    'file',
    'image'
);


--
-- TOC entry 961 (class 1247 OID 17364)
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'U',
    'I',
    'D'
);


--
-- TOC entry 967 (class 1247 OID 17472)
-- Name: bug_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bug_status AS ENUM (
    'open',
    'acknowledged',
    'investigating',
    'fixed',
    'rejected'
);


--
-- TOC entry 958 (class 1247 OID 17352)
-- Name: issue_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_priority AS ENUM (
    'lowest',
    'low',
    'medium',
    'high',
    'highest'
);


--
-- TOC entry 979 (class 1247 OID 17510)
-- Name: issue_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_role AS ENUM (
    'contributor',
    'reviewer',
    'watcher'
);


--
-- TOC entry 985 (class 1247 OID 17526)
-- Name: issue_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_status AS ENUM (
    'open',
    'in_progress',
    'in_review',
    'fixed',
    'rejected',
    'closed'
);


--
-- TOC entry 955 (class 1247 OID 17343)
-- Name: issue_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_type AS ENUM (
    'task',
    'bug',
    'story',
    'epic'
);


--
-- TOC entry 973 (class 1247 OID 17490)
-- Name: org_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


--
-- TOC entry 964 (class 1247 OID 17464)
-- Name: platform_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'support_admin',
    'billing_admin'
);


--
-- TOC entry 988 (class 1247 OID 17540)
-- Name: priority_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- TOC entry 976 (class 1247 OID 17500)
-- Name: project_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_role AS ENUM (
    'project_admin',
    'contributor',
    'reviewer',
    'viewer'
);


--
-- TOC entry 982 (class 1247 OID 17518)
-- Name: project_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_status AS ENUM (
    'active',
    'completed',
    'archived'
);


--
-- TOC entry 994 (class 1247 OID 17556)
-- Name: site_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.site_status AS ENUM (
    'active',
    'archived',
    'suspended'
);


--
-- TOC entry 259 (class 1255 OID 17999)
-- Name: auth_current_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_current_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
select current_setting('app.current_user_id')::uuid;
$$;


--
-- TOC entry 319 (class 1255 OID 18008)
-- Name: auth_is_issue_contributor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_issue_contributor(p_issue_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'contributor'
                    AND
                    im.deleted_at is NULL
            )
$$;


--
-- TOC entry 237 (class 1255 OID 18009)
-- Name: auth_is_issue_reviewer(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_issue_reviewer(p_issue_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'reviewer'
                    AND
                    im.deleted_at is NULL
            )

$$;


--
-- TOC entry 285 (class 1255 OID 18010)
-- Name: auth_is_issue_watcher(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_issue_watcher(p_issue_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'watcher'
                    AND
                    im.deleted_at is NULL
            )
$$;


--
-- TOC entry 235 (class 1255 OID 18002)
-- Name: auth_is_org_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_org_admin(p_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT
    exists 
        (
            select
                1
            FROM
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'admin'
                AND
                om.deleted_at is NULL
        )
$$;


--
-- TOC entry 331 (class 1255 OID 18000)
-- Name: auth_is_org_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_org_member(p_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select exists 
            (
                select 1
                from organization_memberships as om 
                where 
                    om.org_id = p_org_id
                    AND
                    om.user_id = auth_current_user_id()
                    AND
                    om.role = 'member'
                    AND
                    om.deleted_at is NULL
            )
$$;


--
-- TOC entry 233 (class 1255 OID 18003)
-- Name: auth_is_org_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_org_owner(p_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT
    EXISTS
        (
            SELECT
                1
            FROM
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'owner'
                AND
                om.deleted_at is null
        )
$$;


--
-- TOC entry 243 (class 1255 OID 18001)
-- Name: auth_is_org_viewer(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_org_viewer(p_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT 
    exists 
        (
            select
                 1
            from 
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'viewer'
                AND
                om.deleted_at is NULL
        )
$$;


--
-- TOC entry 261 (class 1255 OID 18004)
-- Name: auth_is_project_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_project_admin(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select 
    exists 
            (
                select 
                    1
                from 
                    project_memberships as pm 
                where 
                    pm.project_id = p_project_id
                    AND
                    pm.user_id = auth_current_user_id()
                    AND
                    pm.role = 'project_admin'::project_role
                    AND
                    pm.deleted_at is NULL
            )
$$;


--
-- TOC entry 270 (class 1255 OID 18005)
-- Name: auth_is_project_contributor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_project_contributor(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
select 
    EXISTS
            (
                select
                    1
                FROM
                    project_memberships as pm
                WHERE
                    pm.project_id = p_project_id
                    AND
                    pm.user_id = auth_current_user_id()
                    AND
                    pm.role = 'contributor'::project_role
                    AND
                    pm.deleted_at is NULL
            )
$$;


--
-- TOC entry 292 (class 1255 OID 18006)
-- Name: auth_is_project_reviewer(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_project_reviewer(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT
    EXISTS
        (
            select 
                1
            FROM
                project_memberships as pm
            where 
                pm.project_id = p_project_id
                AND
                pm.user_id = auth_current_user_id()
                AND
                pm.role = 'reviewer'::project_role
                AND
                pm.deleted_at is null
        )
$$;


--
-- TOC entry 326 (class 1255 OID 18007)
-- Name: auth_is_project_viewer(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_is_project_viewer(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT
    EXISTS
        (
            select 
                1
            FROM
                project_memberships as pm
            where 
                pm.project_id = p_project_id
                AND
                pm.user_id = auth_current_user_id()
                AND
                pm.role = 'viewer'::project_role
                AND
                pm.deleted_at is null
        )
$$;


--
-- TOC entry 234 (class 1255 OID 17988)
-- Name: can_assign_project_role(public.org_role, public.project_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_assign_project_role(p_org_role public.org_role, p_project_role public.project_role) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
begin
	-- owner|admin: her project rolunu atabilir
	if p_org_role in ('owner','admin') then
		return true;
	end if;

	-- membeR: project_admin olamaz
	if p_org_role = 'member' then
		return  p_project_role in ('contributor' , 'reviewer', 'viewer');
	end if;

	if p_org_role = 'viewer' then
		return p_project_role = 'viewer';
	end if;

	return false;
end;
$$;


--
-- TOC entry 240 (class 1255 OID 17982)
-- Name: create_organization(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_organization(p_user_id uuid, p_org_name text, p_slug text, p_description text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_org_id uuid;
    v_slug text;
    v_org_count integer;
BEGIN
    -- =========================
    -- VALIDATION
    -- =========================
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User id is required';
    END IF;

    -- Kullanıcı aktif mi?
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE user_id = p_user_id
          AND user_is_active = true
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;

    -- =========================
    -- ORGANIZATION LIMIT CONTROL
    -- =========================
    
    SELECT COUNT(*) INTO v_org_count
    FROM organizations
    WHERE created_by = p_user_id
      AND deleted_at IS NULL;

    IF v_org_count >= 2 THEN
        RAISE EXCEPTION 'Organization creation limit reached (max 2)';
    END IF;

    -- =========================
    -- FIELD VALIDATION
    -- =========================
    
    IF p_org_name IS NULL OR length(trim(p_org_name)) = 0 THEN
        RAISE EXCEPTION 'Organization name is required';
    END IF;

    IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
        RAISE EXCEPTION 'Slug is required';
    END IF;

    v_slug := lower(trim(p_slug));

    IF EXISTS (
        SELECT 1 FROM organizations 
        WHERE slug = v_slug 
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Slug already exists';
    END IF;

    -- =========================
    -- INSERT ORGANIZATION
    -- =========================
    
    INSERT INTO organizations (
        org_name,
        slug,
        org_check_id,
        org_description,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        trim(p_org_name),
        v_slug,
        encode(gen_random_bytes(6), 'hex'),
        p_description,
        p_user_id,
        now(),
        now()
    )
    RETURNING org_id INTO v_org_id;

    -- =========================
    -- INSERT OWNER MEMBERSHIP
    -- =========================
    
    INSERT INTO organization_memberships (
        org_id,
        user_id,
        role,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        v_org_id,
        p_user_id,
        'owner',
        true,
        now(),
        now(),
        now()
    );

    -- =========================
    -- AUDIT
    -- =========================
    
    INSERT INTO system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    VALUES (
        'tenant_user',
        p_user_id,
        'organization',
        v_org_id,
        'CREATE',
        jsonb_build_object(
            'org_name', trim(p_org_name),
            'slug', v_slug
        ),
        now()
    );

    RETURN v_org_id;
END;
$$;


--
-- TOC entry 329 (class 1255 OID 17989)
-- Name: trg_project_memberships_role_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_project_memberships_role_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
	v_org_id uuid;
	v_org_role org_role;
begin
	
		-- Project -> Site -> Organization
		select 
			s.org_id
		into
			v_org_id
		from 
			projects as p
		join 
			sites as s on s.site_id = p.site_id
		where
			p.project_id = NEW.project_id;


		if v_org_id is null then 
			raise exception 'Organization not found  for project %', NEW.project_id;
		end if;


		-- Kullanıcının organization rolunu al
		select
			om.role
		into 
			v_org_role
		from 
			organization_memberships as om 
		where 
			om.org_id = v_org_id
					and
			om.user_id = NEW.user_id
					and
			om.membership_is_active = true
					and
			om.deleted_at is null;



		if v_org_role is null then 
			raise exception 
				'User % is not an active member of organization %',
				NEW.user_id , v_org_id;
		end if;

		-- Escalation kontrolü
		if not can_assign_project_role(v_org_role , NEW.role) then
			raise exception
			'Role escalation blocked: org_role= % cannot be assigned project_role = %',
			v_org_role, NEW.role;
		end if;

		return NEW;
end;
$$;


--
-- TOC entry 231 (class 1259 OID 17945)
-- Name: application_bugs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.application_bugs (
    bug_id uuid DEFAULT gen_random_uuid() NOT NULL,
    reported_by uuid NOT NULL,
    org_id uuid,
    project_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    status public.bug_status DEFAULT 'open'::public.bug_status NOT NULL,
    priority public.priority_level DEFAULT 'medium'::public.priority_level,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 230 (class 1259 OID 17918)
-- Name: issue_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_assets (
    issue_asset_id uuid DEFAULT gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    uploaded_by uuid,
    asset_type public.asset_type NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    byte_size bigint,
    storage_key text NOT NULL,
    checksum text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 227 (class 1259 OID 17840)
-- Name: issue_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_memberships (
    issue_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.issue_role NOT NULL,
    membership_is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 226 (class 1259 OID 17795)
-- Name: issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issues (
    issue_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    issue_no bigint NOT NULL,
    issue_title text NOT NULL,
    issue_description text,
    status public.issue_status DEFAULT 'open'::public.issue_status NOT NULL,
    priority public.priority_level DEFAULT 'medium'::public.priority_level,
    reporter_id uuid,
    assignee_id uuid,
    parent_issue_id uuid,
    blocking_issue_id uuid,
    issue_is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    is_private boolean DEFAULT false NOT NULL,
    is_editable boolean DEFAULT false NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 17864)
-- Name: organization_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_assets (
    org_asset_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    uploaded_by uuid,
    asset_type public.asset_type NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    byte_size bigint,
    storage_key text NOT NULL,
    checksum text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 221 (class 1259 OID 17637)
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_memberships (
    org_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.org_role DEFAULT 'viewer'::public.org_role NOT NULL,
    invited_by uuid,
    membership_is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 220 (class 1259 OID 17612)
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    org_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_check_id text NOT NULL,
    org_name text NOT NULL,
    org_description text,
    slug text NOT NULL,
    org_status text DEFAULT 'active'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 217 (class 1259 OID 17563)
-- Name: platform_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_users (
    platform_user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    role public.platform_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 229 (class 1259 OID 17891)
-- Name: project_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_assets (
    project_asset_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    uploaded_by uuid,
    asset_type public.asset_type NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    byte_size bigint,
    storage_key text NOT NULL,
    checksum text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 224 (class 1259 OID 17732)
-- Name: project_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_memberships (
    project_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.project_role NOT NULL,
    invited_by uuid,
    membership_is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 225 (class 1259 OID 17764)
-- Name: project_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_requirements (
    requirement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    priority public.priority_level DEFAULT 'medium'::public.priority_level,
    is_done boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    done_by uuid,
    done_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 223 (class 1259 OID 17697)
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    project_check_id text NOT NULL,
    project_name text NOT NULL,
    project_description text,
    slug text,
    project_status public.project_status DEFAULT 'active'::public.project_status NOT NULL,
    created_by uuid,
    completed_at timestamp with time zone,
    completed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    is_private boolean DEFAULT false NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 17669)
-- Name: sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sites (
    site_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    site_name text NOT NULL,
    site_slug text NOT NULL,
    site_status public.site_status DEFAULT 'active'::public.site_status NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 218 (class 1259 OID 17581)
-- Name: system_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_audit_logs (
    audit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_type public.actor_type NOT NULL,
    actor_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action_type text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 17590)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_name text NOT NULL,
    user_last_name text,
    user_display_name text,
    user_email public.citext NOT NULL,
    user_password text NOT NULL,
    user_is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    user_friendship_code uuid DEFAULT gen_random_uuid() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- TOC entry 3823 (class 0 OID 17945)
-- Dependencies: 231
-- Data for Name: application_bugs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.application_bugs (bug_id, reported_by, org_id, project_id, title, description, status, priority, assigned_to, created_at, resolved_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3822 (class 0 OID 17918)
-- Dependencies: 230
-- Data for Name: issue_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issue_assets (issue_asset_id, issue_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3819 (class 0 OID 17840)
-- Dependencies: 227
-- Data for Name: issue_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issue_memberships (issue_membership_id, issue_id, user_id, role, membership_is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3818 (class 0 OID 17795)
-- Dependencies: 226
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issues (issue_id, project_id, issue_no, issue_title, issue_description, status, priority, reporter_id, assignee_id, parent_issue_id, blocking_issue_id, issue_is_active, created_at, updated_at, deleted_at, deleted_by, is_private, is_editable) FROM stdin;
\.


--
-- TOC entry 3820 (class 0 OID 17864)
-- Dependencies: 228
-- Data for Name: organization_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_assets (org_asset_id, org_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3813 (class 0 OID 17637)
-- Dependencies: 221
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_memberships (org_membership_id, org_id, user_id, role, invited_by, membership_is_active, joined_at, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3812 (class 0 OID 17612)
-- Dependencies: 220
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (org_id, org_check_id, org_name, org_description, slug, org_status, created_by, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3809 (class 0 OID 17563)
-- Dependencies: 217
-- Data for Name: platform_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_users (platform_user_id, email, password_hash, role, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3821 (class 0 OID 17891)
-- Dependencies: 229
-- Data for Name: project_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_assets (project_asset_id, project_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3816 (class 0 OID 17732)
-- Dependencies: 224
-- Data for Name: project_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_memberships (project_membership_id, project_id, user_id, role, invited_by, membership_is_active, joined_at, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3817 (class 0 OID 17764)
-- Dependencies: 225
-- Data for Name: project_requirements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_requirements (requirement_id, project_id, title, description, priority, is_done, created_by, created_at, done_by, done_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3815 (class 0 OID 17697)
-- Dependencies: 223
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (project_id, site_id, project_check_id, project_name, project_description, slug, project_status, created_by, completed_at, completed_by, created_at, updated_at, deleted_at, deleted_by, is_private) FROM stdin;
\.


--
-- TOC entry 3814 (class 0 OID 17669)
-- Dependencies: 222
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sites (site_id, org_id, site_name, site_slug, site_status, created_by, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3810 (class 0 OID 17581)
-- Dependencies: 218
-- Data for Name: system_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_audit_logs (audit_id, actor_type, actor_id, entity_type, entity_id, action_type, old_value, new_value, created_at) FROM stdin;
\.


--
-- TOC entry 3811 (class 0 OID 17590)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, user_name, user_last_name, user_display_name, user_email, user_password, user_is_active, last_login_at, user_friendship_code, metadata, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3613 (class 2606 OID 17955)
-- Name: application_bugs application_bugs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_pkey PRIMARY KEY (bug_id);


--
-- TOC entry 3611 (class 2606 OID 17929)
-- Name: issue_assets issue_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_pkey PRIMARY KEY (issue_asset_id);


--
-- TOC entry 3605 (class 2606 OID 17848)
-- Name: issue_memberships issue_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_pkey PRIMARY KEY (issue_membership_id);


--
-- TOC entry 3601 (class 2606 OID 17807)
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (issue_id);


--
-- TOC entry 3603 (class 2606 OID 17809)
-- Name: issues issues_project_id_issue_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_issue_no_key UNIQUE (project_id, issue_no);


--
-- TOC entry 3607 (class 2606 OID 17875)
-- Name: organization_assets organization_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_pkey PRIMARY KEY (org_asset_id);


--
-- TOC entry 3581 (class 2606 OID 17648)
-- Name: organization_memberships organization_memberships_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- TOC entry 3583 (class 2606 OID 17646)
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (org_membership_id);


--
-- TOC entry 3575 (class 2606 OID 17624)
-- Name: organizations organizations_org_check_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_org_check_id_key UNIQUE (org_check_id);


--
-- TOC entry 3577 (class 2606 OID 17622)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (org_id);


--
-- TOC entry 3579 (class 2606 OID 17626)
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- TOC entry 3563 (class 2606 OID 17575)
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- TOC entry 3565 (class 2606 OID 17573)
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (platform_user_id);


--
-- TOC entry 3609 (class 2606 OID 17902)
-- Name: project_assets project_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_pkey PRIMARY KEY (project_asset_id);


--
-- TOC entry 3595 (class 2606 OID 17741)
-- Name: project_memberships project_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_pkey PRIMARY KEY (project_membership_id);


--
-- TOC entry 3597 (class 2606 OID 17743)
-- Name: project_memberships project_memberships_project_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_user_id_key UNIQUE (project_id, user_id);


--
-- TOC entry 3599 (class 2606 OID 17774)
-- Name: project_requirements project_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_pkey PRIMARY KEY (requirement_id);


--
-- TOC entry 3589 (class 2606 OID 17707)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- TOC entry 3591 (class 2606 OID 17709)
-- Name: projects projects_project_check_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_check_id_key UNIQUE (project_check_id);


--
-- TOC entry 3593 (class 2606 OID 17711)
-- Name: projects projects_site_id_project_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_project_name_key UNIQUE (site_id, project_name);


--
-- TOC entry 3585 (class 2606 OID 17681)
-- Name: sites sites_org_id_site_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_site_slug_key UNIQUE (org_id, site_slug);


--
-- TOC entry 3587 (class 2606 OID 17679)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (site_id);


--
-- TOC entry 3567 (class 2606 OID 17589)
-- Name: system_audit_logs system_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 3569 (class 2606 OID 17602)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3571 (class 2606 OID 17604)
-- Name: users users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_email_key UNIQUE (user_email);


--
-- TOC entry 3573 (class 2606 OID 17606)
-- Name: users users_user_friendship_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_friendship_code_key UNIQUE (user_friendship_code);


--
-- TOC entry 3660 (class 2620 OID 17990)
-- Name: project_memberships project_memberships_role_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_memberships_role_guard BEFORE INSERT OR UPDATE OF role ON public.project_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_project_memberships_role_guard();


--
-- TOC entry 3655 (class 2606 OID 17971)
-- Name: application_bugs application_bugs_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3656 (class 2606 OID 17976)
-- Name: application_bugs application_bugs_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3657 (class 2606 OID 17961)
-- Name: application_bugs application_bugs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE SET NULL;


--
-- TOC entry 3658 (class 2606 OID 17966)
-- Name: application_bugs application_bugs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE SET NULL;


--
-- TOC entry 3659 (class 2606 OID 17956)
-- Name: application_bugs application_bugs_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id);


--
-- TOC entry 3652 (class 2606 OID 17940)
-- Name: issue_assets issue_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3653 (class 2606 OID 17930)
-- Name: issue_assets issue_assets_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3654 (class 2606 OID 17935)
-- Name: issue_assets issue_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3643 (class 2606 OID 17859)
-- Name: issue_memberships issue_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3644 (class 2606 OID 17849)
-- Name: issue_memberships issue_memberships_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3645 (class 2606 OID 17854)
-- Name: issue_memberships issue_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3637 (class 2606 OID 17820)
-- Name: issues issues_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3638 (class 2606 OID 17830)
-- Name: issues issues_blocking_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_blocking_issue_id_fkey FOREIGN KEY (blocking_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3639 (class 2606 OID 17835)
-- Name: issues issues_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3640 (class 2606 OID 17825)
-- Name: issues issues_parent_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_parent_issue_id_fkey FOREIGN KEY (parent_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3641 (class 2606 OID 17810)
-- Name: issues issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3642 (class 2606 OID 17815)
-- Name: issues issues_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3646 (class 2606 OID 17886)
-- Name: organization_assets organization_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3647 (class 2606 OID 17876)
-- Name: organization_assets organization_assets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3648 (class 2606 OID 17881)
-- Name: organization_assets organization_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3618 (class 2606 OID 17664)
-- Name: organization_memberships organization_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3619 (class 2606 OID 17659)
-- Name: organization_memberships organization_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3620 (class 2606 OID 17649)
-- Name: organization_memberships organization_memberships_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3621 (class 2606 OID 17654)
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3616 (class 2606 OID 17627)
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3617 (class 2606 OID 17632)
-- Name: organizations organizations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3614 (class 2606 OID 17576)
-- Name: platform_users platform_users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3649 (class 2606 OID 17913)
-- Name: project_assets project_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3650 (class 2606 OID 17903)
-- Name: project_assets project_assets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3651 (class 2606 OID 17908)
-- Name: project_assets project_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3629 (class 2606 OID 17759)
-- Name: project_memberships project_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3630 (class 2606 OID 17754)
-- Name: project_memberships project_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3631 (class 2606 OID 17744)
-- Name: project_memberships project_memberships_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3632 (class 2606 OID 17749)
-- Name: project_memberships project_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3633 (class 2606 OID 17780)
-- Name: project_requirements project_requirements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3634 (class 2606 OID 17790)
-- Name: project_requirements project_requirements_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3635 (class 2606 OID 17785)
-- Name: project_requirements project_requirements_done_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_done_by_fkey FOREIGN KEY (done_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3636 (class 2606 OID 17775)
-- Name: project_requirements project_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3625 (class 2606 OID 17722)
-- Name: projects projects_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3626 (class 2606 OID 17717)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3627 (class 2606 OID 17727)
-- Name: projects projects_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3628 (class 2606 OID 17712)
-- Name: projects projects_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3622 (class 2606 OID 17687)
-- Name: sites sites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3623 (class 2606 OID 17692)
-- Name: sites sites_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3624 (class 2606 OID 17682)
-- Name: sites sites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3615 (class 2606 OID 17607)
-- Name: users users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3804 (class 0 OID 17612)
-- Dependencies: 220
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3807 (class 3256 OID 18017)
-- Name: organizations organizations_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_delete_policy ON public.organizations FOR DELETE USING (public.auth_is_org_owner(org_id));


--
-- TOC entry 3808 (class 3256 OID 18018)
-- Name: organizations organizations_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_insert_policy ON public.organizations FOR INSERT WITH CHECK ((created_by = public.auth_current_user_id()));


--
-- TOC entry 3805 (class 3256 OID 18015)
-- Name: organizations organizations_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_select_policy ON public.organizations FOR SELECT USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id) OR public.auth_is_org_member(org_id) OR public.auth_is_org_viewer(org_id)));


--
-- TOC entry 3806 (class 3256 OID 18016)
-- Name: organizations organizations_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_update_policy ON public.organizations FOR UPDATE USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id))) WITH CHECK ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id)));


-- Completed on 2026-03-19 02:15:34 +03

--
-- PostgreSQL database dump complete
--

\unrestrict x2JNAtqaNh4C0tb8kcmmyw2og610omq7dA2YTwCrc6G6ddB5pSmFc5yxOYNhdq1

