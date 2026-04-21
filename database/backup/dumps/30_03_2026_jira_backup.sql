--
-- PostgreSQL database dump
--

\restrict 4oiUHodjGMlb0LgFlrYYsCEztKaPNv4ehWfo4Xf6y6pXVy9JwoH6T5GFnTeUl5F

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

-- Started on 2026-04-13 20:30:56 +03

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
-- TOC entry 4057 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 2 (class 3079 OID 17200)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4058 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 1018 (class 1247 OID 17484)
-- Name: actor_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.actor_type AS ENUM (
    'tenant_user',
    'platform_user'
);


ALTER TYPE public.actor_type OWNER TO postgres;

--
-- TOC entry 1039 (class 1247 OID 17550)
-- Name: asset_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.asset_type AS ENUM (
    'file',
    'image'
);


ALTER TYPE public.asset_type OWNER TO postgres;

--
-- TOC entry 1009 (class 1247 OID 17364)
-- Name: audit_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_action AS ENUM (
    'U',
    'I',
    'D'
);


ALTER TYPE public.audit_action OWNER TO postgres;

--
-- TOC entry 1015 (class 1247 OID 17472)
-- Name: bug_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.bug_status AS ENUM (
    'open',
    'acknowledged',
    'investigating',
    'fixed',
    'rejected'
);


ALTER TYPE public.bug_status OWNER TO postgres;

--
-- TOC entry 1006 (class 1247 OID 17352)
-- Name: issue_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issue_priority AS ENUM (
    'lowest',
    'low',
    'medium',
    'high',
    'highest'
);


ALTER TYPE public.issue_priority OWNER TO postgres;

--
-- TOC entry 1027 (class 1247 OID 17510)
-- Name: issue_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issue_role AS ENUM (
    'contributor',
    'reviewer',
    'watcher'
);


ALTER TYPE public.issue_role OWNER TO postgres;

--
-- TOC entry 1033 (class 1247 OID 17526)
-- Name: issue_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issue_status AS ENUM (
    'open',
    'in_progress',
    'in_review',
    'fixed',
    'rejected',
    'closed'
);


ALTER TYPE public.issue_status OWNER TO postgres;

--
-- TOC entry 1003 (class 1247 OID 17343)
-- Name: issue_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issue_type AS ENUM (
    'task',
    'bug',
    'story',
    'epic'
);


ALTER TYPE public.issue_type OWNER TO postgres;

--
-- TOC entry 1021 (class 1247 OID 17490)
-- Name: org_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.org_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


ALTER TYPE public.org_role OWNER TO postgres;

--
-- TOC entry 1099 (class 1247 OID 18100)
-- Name: org_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.org_status AS ENUM (
    'active',
    'completed',
    'archived'
);


ALTER TYPE public.org_status OWNER TO postgres;

--
-- TOC entry 1012 (class 1247 OID 17464)
-- Name: platform_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'support_admin',
    'billing_admin'
);


ALTER TYPE public.platform_role OWNER TO postgres;

--
-- TOC entry 1036 (class 1247 OID 17540)
-- Name: priority_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.priority_level OWNER TO postgres;

--
-- TOC entry 1024 (class 1247 OID 17500)
-- Name: project_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.project_role AS ENUM (
    'project_admin',
    'contributor',
    'reviewer',
    'viewer'
);


ALTER TYPE public.project_role OWNER TO postgres;

--
-- TOC entry 1030 (class 1247 OID 17518)
-- Name: project_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.project_status AS ENUM (
    'active',
    'completed',
    'archived'
);


ALTER TYPE public.project_status OWNER TO postgres;

--
-- TOC entry 1090 (class 1247 OID 18026)
-- Name: site_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.site_role AS ENUM (
    'admin',
    'contrubitor',
    'viewer'
);


ALTER TYPE public.site_role OWNER TO postgres;

--
-- TOC entry 1042 (class 1247 OID 17556)
-- Name: site_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.site_status AS ENUM (
    'active',
    'archived',
    'suspended'
);


ALTER TYPE public.site_status OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 17999)
-- Name: auth_current_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_current_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
select current_setting('app.current_user_id')::uuid;
$$;


ALTER FUNCTION public.auth_current_user_id() OWNER TO postgres;

--
-- TOC entry 359 (class 1255 OID 18008)
-- Name: auth_is_issue_contributor(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_issue_contributor(p_issue_id uuid) OWNER TO postgres;

--
-- TOC entry 249 (class 1255 OID 18009)
-- Name: auth_is_issue_reviewer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_issue_reviewer(p_issue_id uuid) OWNER TO postgres;

--
-- TOC entry 314 (class 1255 OID 18010)
-- Name: auth_is_issue_watcher(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_issue_watcher(p_issue_id uuid) OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 18002)
-- Name: auth_is_org_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_org_admin(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 376 (class 1255 OID 18000)
-- Name: auth_is_org_member(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_org_member(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 245 (class 1255 OID 18003)
-- Name: auth_is_org_owner(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_org_owner(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 257 (class 1255 OID 18001)
-- Name: auth_is_org_viewer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_org_viewer(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 285 (class 1255 OID 18004)
-- Name: auth_is_project_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_project_admin(p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 297 (class 1255 OID 18005)
-- Name: auth_is_project_contributor(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_project_contributor(p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 323 (class 1255 OID 18006)
-- Name: auth_is_project_reviewer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_project_reviewer(p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 369 (class 1255 OID 18007)
-- Name: auth_is_project_viewer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auth_is_project_viewer(p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 342 (class 1255 OID 18092)
-- Name: auth_is_site_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_site_admin(p_site_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT
        EXISTS
            (
                SELECT
                    1
                from    
                    site_memberships as sm
                WHERE
                    sm.site_id = p_site_id
                    AND
                    sm.user_id = auth_current_user_id()
                    AND
                    sm.role = 'admin'
                    AND
                    sm.deleted_at is null
            )

$$;


ALTER FUNCTION public.auth_is_site_admin(p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 370 (class 1255 OID 18095)
-- Name: auth_is_site_contrubitor(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_site_contrubitor(p_site_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT
        EXISTS
        (
            SELECT
                1
            from
                site_memberships as sm
            WHERE
                sm.site_id = p_site_id
                AND
                sm.user_id = auth_current_user_id()
                AND
                sm.role = 'contrubitor'
                AND
                sm.deleted_at is null
        )

$$;


ALTER FUNCTION public.auth_is_site_contrubitor(p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 335 (class 1255 OID 18094)
-- Name: auth_is_site_viewer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_site_viewer(p_site_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT
        EXISTS
        (
            SELECT
                1
            from
                site_memberships as sm
            WHERE
                sm.site_id = p_site_id
                AND
                sm.user_id = auth_current_user_id()
                AND
                sm.role = 'viewer'
                AND
                sm.deleted_at is null
        )

$$;


ALTER FUNCTION public.auth_is_site_viewer(p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 17988)
-- Name: can_assign_project_role(public.org_role, public.project_role); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.can_assign_project_role(p_org_role public.org_role, p_project_role public.project_role) OWNER TO postgres;

--
-- TOC entry 329 (class 1255 OID 18185)
-- Name: create_issues(uuid, text, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_issues(p_project_id uuid, p_issue_title text, p_issue_description text DEFAULT NULL::text, p_is_private boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_issue_id uuid;
    v_issue_no bigint;
    v_issue_title text;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_project_name text;
    v_site_name text;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is NULL THEN
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue title validasyonu
    v_issue_title := trim(p_issue_title);

    if v_issue_title is null or length(v_issue_title) = 0 THEN
        raise EXCEPTION 'Issue title cannot be empty';
    end if;

    -- 3. Project kontrolü ve bilgileri al
    SELECT 
        p.site_id,
        p.project_name,
        p.is_private,
        s.org_id,
        s.is_private as site_is_private,
        s.site_name
    INTO 
        v_site_id,
        v_project_name,
        v_is_project_private,
        v_org_id,
        v_is_site_private,
        v_site_name
    FROM projects p
    JOIN sites s ON s.site_id = p.site_id
    WHERE p.project_id = p_project_id
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;

    if v_site_id is null THEN
        raise exception 'Project not found';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 5. Yetki kontrolü
    -- Org owner: her şeyi yapabilir
    -- Site admin: her şeyi yapabilir
    -- Project admin: her şeyi yapabilir
    -- Org admin: sadece site ve project private DEĞİLSE issue oluşturabilir
    
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site ve project private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot create issues in private sites or private projects';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to create issues in this project';
    END IF;

    -- 6. Issue number'ı bul (proje bazında sıralı)
    SELECT COALESCE(MAX(issue_no), 0) + 1 INTO v_issue_no
    FROM issues
    WHERE project_id = p_project_id
        AND deleted_at IS NULL;

    -- 7. Issue oluştur
    INSERT INTO issues (
        project_id,
        issue_no,
        issue_title,
        issue_description,
        status,
        priority,
        reporter_id,
        is_private,
        is_editable,
        created_at,
        updated_at
    )
    VALUES (
        p_project_id,
        v_issue_no,
        v_issue_title,
        p_issue_description,
        'open',
        'medium',
        v_user_id,
        p_is_private,
        true,
        now(),
        now()
    )
    RETURNING issue_id INTO v_issue_id;

    -- 8. Issue membership - oluşturan kişiyi contributor olarak ekle
    INSERT INTO issue_memberships (
        issue_id,
        user_id,
        role,
        membership_is_active,
        created_at,
        updated_at
    )
    VALUES (
        v_issue_id,
        v_user_id,
        'contributor',
        true,
        now(),
        now()
    );

    -- 9. Audit log
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
        v_user_id,
        'issue',
        v_issue_id,
        'CREATE',
        jsonb_build_object(
            'issue_title', v_issue_title,
            'issue_no', v_issue_no,
            'project_id', p_project_id,
            'project_name', v_project_name,
            'site_id', v_site_id,
            'site_name', v_site_name,
            'is_private', p_is_private
        ),
        now()
    );

    RETURN v_issue_id;
    
END;
$$;


ALTER FUNCTION public.create_issues(p_project_id uuid, p_issue_title text, p_issue_description text, p_is_private boolean) OWNER TO postgres;

--
-- TOC entry 299 (class 1255 OID 18022)
-- Name: create_organization(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_organization(org_name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_org_id uuid;
    v_user_id uuid;
    v_org_name text;
begin

    -- normalize name
    v_org_name := trim(org_name);

    -- user check
    v_user_id := auth_current_useR_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- organization name validation
    if v_org_name is null or length(v_org_name) = 0 then
        raise exception 'organization name cannot be empty';
    end if;

    -- organization create
    insert into organizations (
        org_name,
        created_by
    )
    values (
        v_org_name,
        v_user_id
    )
    returning org_id
    into v_org_id;

    -- owner membership create
    insert into organization_memberships (
        org_id,
        user_id,
        role,
        membership_is_active
    )
    values (
        v_org_id,
        v_user_id,
        'owner',
        true
    );

    return v_org_id;

end;
$$;


ALTER FUNCTION public.create_organization(org_name text) OWNER TO postgres;

--
-- TOC entry 253 (class 1255 OID 17982)
-- Name: create_organization(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.create_organization(p_user_id uuid, p_org_name text, p_slug text, p_description text) OWNER TO postgres;

--
-- TOC entry 277 (class 1255 OID 18197)
-- Name: create_project(uuid, text, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_project(p_site_id uuid, p_project_name text, p_project_description text DEFAULT NULL::text, p_is_private boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_project_id uuid;
    v_project_name text;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Project name validasyonu
    v_project_name := trim(p_project_name);
    
    if v_project_name is null or length(v_project_name) = 0 then
        raise exception 'Project name cannot be empty';
    end if;
    
    -- 3. Site var mı ve organization ID'sini al
    select org_id into v_org_id
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found';
    end if;
    
    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    
    -- 5. Yetki kontrolü
    -- Yetkisiz durumları kontrol et, yetkili durumlar otomatik geçer
    if not (v_is_org_owner or (v_is_org_admin and v_is_site_admin)) then
        -- Yetkili değil, neden yetkisiz olduğunu bul
        if v_is_org_admin and not v_is_site_admin then
            raise exception 'Permission denied: Org admin must be site admin to create a project';
        else
            raise exception 'Permission denied: Only org owner, org admin (with site admin), or site admin can create projects';
        end if;
    end if;
    
    -- 6. Aynı site içinde aynı isimde proje var mı?
    if exists (
        select 1
        from projects
        where site_id = p_site_id
            and project_name = v_project_name
            and deleted_at is null
    ) then
        raise exception 'Project with name "%" already exists in this site', v_project_name;
    end if;
    
    -- 7. Proje oluştur
    insert into projects (
        site_id,
        project_check_id,
        project_name,
        project_description,
        slug,
        project_status,
        is_private,
        created_by,
        created_at,
        updated_at
    )
    values (
        p_site_id,
        encode(gen_random_bytes(6), 'hex'),  -- random check id
        v_project_name,
        p_project_description,
        lower(regexp_replace(v_project_name, '[^a-zA-Z0-9]', '-', 'g')),  -- slug oluştur
        'active',
        p_is_private,
        v_user_id,
        now(),
        now()
    )
    returning project_id into v_project_id;
    
    -- 8. Project membership - oluşturan kişiyi project_admin yap
    insert into project_memberships (
        project_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    values (
        v_project_id,
        v_user_id,
        'project_admin',
        v_user_id,
        true,
        now(),
        now(),
        now()
    );
    
    -- 9. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'project',
        v_project_id,
        'CREATE',
        jsonb_build_object(
            'project_name', v_project_name,
            'site_id', p_site_id,
            'is_private', p_is_private
        ),
        now()
    );
    
    return v_project_id;
    
end;
$$;


ALTER FUNCTION public.create_project(p_site_id uuid, p_project_name text, p_project_description text, p_is_private boolean) OWNER TO postgres;

--
-- TOC entry 320 (class 1255 OID 18206)
-- Name: create_sites(text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_sites(p_site_name text, p_site_slug text, p_org_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_site_name text;
    v_site_slug text;
begin
    -- kullanıcı kontrolu 
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;

    -- normalize 
    v_site_name := trim(p_site_name);
    v_site_slug := lower(trim(p_site_slug));

    if v_site_name is null or length(v_site_name) = 0 then
        raise exception 'Site name cannot be null';
    end if;

    if v_site_slug is null or length(v_site_slug) = 0 then
        raise exception 'Site slug cannot be null';
    end if;

    -- organization id çek
    v_org_id := get_organization_id(p_org_id);

    if not (auth_is_org_owner(v_org_id) or auth_is_org_admin(v_org_id)) then
        raise exception 'Only organization owner or admin can create sites';
    end if;

    -- slug unique mi kontrol
    if exists (
        select 1
        from sites
        where org_id = v_org_id
            and site_slug = v_site_slug
            and deleted_at is null
    ) then
        raise exception 'Site slug "%" already exists in this organization', v_site_slug;
    end if;

    -- site oluştur
    insert into sites (
        org_id,
        site_name,
        site_slug,
        site_status,
        created_by,
        created_at,
        updated_at
    )
    values (
        v_org_id,
        v_site_name,
        v_site_slug,
        'active',
        v_user_id,
        now(),
        now()
    )
    returning site_id into v_site_id;

    -- site membership oluştur
    insert into site_memberships (
        site_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    values (
        v_site_id,
        v_user_id,
        'site_admin',              -- 👈 DÜZELTİLDİ: role buraya gelmeli
        v_user_id,                 -- 👈 invited_by
        true,
        now(),
        now(),
        now()
    );
    
    return v_site_id;
end;
$$;


ALTER FUNCTION public.create_sites(p_site_name text, p_site_slug text, p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 347 (class 1255 OID 18188)
-- Name: delete_issues(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_issues(p_issue_id uuid, p_project_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_issue_title text;
    v_issue_status issue_status;
    v_project_name text;           -- 👈 EKSİK OLAN SATIR
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is NULL THEN
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue kontrolü ve bilgileri al
    SELECT 
        i.issue_title,
        i.status,
        p.site_id,
        p.project_name,
        p.is_private as project_is_private,
        s.org_id,
        s.is_private as site_is_private
    INTO 
        v_issue_title,
        v_issue_status,
        v_site_id,
        v_project_name,            -- 👈 ARTIK TANIMLI
        v_is_project_private,
        v_org_id,
        v_is_site_private
    FROM issues i
    JOIN projects p ON p.project_id = i.project_id
    JOIN sites s ON s.site_id = p.site_id
    WHERE i.issue_id = p_issue_id
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;

    if v_site_id is NULL THEN
        raise exception 'Issue not found or already deleted';
    end if;

    -- 3. Project ID kontrolü (parametre varsa)
    if p_project_id is not null and p_project_id != (SELECT project_id FROM issues WHERE issue_id = p_issue_id) then
        raise exception 'Issue does not belong to the specified project';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin((SELECT project_id FROM issues WHERE issue_id = p_issue_id));

    -- 5. Yetki kontrolü
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site ve project private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot delete issues in private sites or private projects';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to delete issues';
    END IF;

    -- 6. Issue status kontrolü (isteğe bağlı)
    -- open/in_progress/in_review durumundaki issue'lar için uyarı (ama yine de silebilir)
    IF v_issue_status IN ('open', 'in_progress', 'in_review') THEN
        -- Sadece uyarı ver, silmeyi engelleme
        RAISE NOTICE 'Warning: Deleting an issue with status "%"', v_issue_status;
    END IF;

    -- 7. Soft delete - issue'yu sil
    UPDATE issues
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        updated_at = now()
    WHERE issue_id = p_issue_id;

    -- 8. Issue memberships'leri soft delete
    UPDATE issue_memberships
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    WHERE issue_id = p_issue_id
        AND deleted_at IS NULL;

    -- 9. Issue assets'leri soft delete
    UPDATE issue_assets
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        is_active = false,
        updated_at = now()
    WHERE issue_id = p_issue_id
        AND deleted_at IS NULL;

    -- 10. Audit log
    INSERT INTO system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    VALUES (
        'tenant_user',
        v_user_id,
        'issue',
        p_issue_id,
        'DELETE',
        jsonb_build_object(
            'issue_title', v_issue_title,
            'issue_status', v_issue_status
        ),
        jsonb_build_object(
            'issue_id', p_issue_id,
            'deleted_by', v_user_id,
            'deleted_at', now()
        ),
        now()
    );

    RETURN true;
    
END;
$$;


ALTER FUNCTION public.delete_issues(p_issue_id uuid, p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 358 (class 1255 OID 18198)
-- Name: delete_project(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_project(p_project_id uuid, p_site_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_project_name text;
    v_project_status project_status;
    v_is_org_owner boolean;
    v_is_project_admin boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Proje var mı ve bilgilerini al
    select 
        p.site_id,
        p.project_name,
        p.project_status,
        s.org_id
    into 
        v_site_id,
        v_project_name,
        v_project_status,
        v_org_id
    from projects p
    join sites s on s.site_id = p.site_id
    where p.project_id = p_project_id
        and p.deleted_at is null;
    
    if v_site_id is null then
        raise exception 'Project not found or already deleted';
    end if;
    
    -- 3. Proje durumu kontrolü
    if v_project_status = 'archived' then
        raise exception 'Project is already archived';
    end if;
    
    -- 4. Site ID kontrolü (parametre varsa)
    if p_site_id is not null and p_site_id != v_site_id then
        raise exception 'Project does not belong to the specified site';
    end if;
    
    -- 5. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);
    
    -- 6. Yetki kontrolü - sadece org_owner veya project_admin
    if not (v_is_org_owner or v_is_project_admin) then
        raise exception 'Only organization owner or project admin can delete projects';
    end if;
    
    -- 7. Soft delete - projeyi arşivle
    update projects
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        project_status = 'archived',
        updated_at = now()
    where project_id = p_project_id;
    
    -- 8. Project memberships'leri soft delete
    update project_memberships
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    where project_id = p_project_id
        and deleted_at is null;
    
    -- 9. Project requirements'leri soft delete
    update project_requirements
    set 
        deleted_at = now(),
        deleted_by = v_user_id
    where project_id = p_project_id
        and deleted_at is null;
    
    -- 10. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'project',
        p_project_id,
        'DELETE',
        jsonb_build_object(
            'project_name', v_project_name,
            'project_status', v_project_status
        ),
        jsonb_build_object(
            'project_id', p_project_id,
            'deleted_by', v_user_id,
            'deleted_at', now(),
            'project_status', 'archived'
        ),
        now()
    );
    
    return true;
    
end;
$$;


ALTER FUNCTION public.delete_project(p_project_id uuid, p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 383 (class 1255 OID 18207)
-- Name: delete_site(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_site(p_site_id uuid, p_org_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_status site_status;
begin
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    select org_id, site_status into v_org_id, v_site_status
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found or already deleted';
    end if;
    
    if v_site_status = 'archived' then
        raise exception 'Site is already archived';
    end if;
    
    if v_site_status = 'suspended' then
        raise exception 'Cannot delete suspended site. Please activate first.';
    end if;
    
    if p_org_id is not null then
        v_org_id := get_organization_id(p_org_id);
    else
        v_org_id := get_organization_id(v_org_id);
    end if;
    
    if not (
        auth_is_org_owner(v_org_id) or 
        auth_is_site_admin(p_site_id)
    ) then
        raise exception 'Only organization owner or site admin can delete sites';
    end if;
    
    update sites
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        site_status = 'archived',  
        updated_at = now()
    where site_id = p_site_id;
    
    update site_memberships
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    where site_id = p_site_id
        and deleted_at is null;
    
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'site',
        p_site_id,
        'DELETE',
        jsonb_build_object(
            'site_id', p_site_id,
            'deleted_by', v_user_id,
            'deleted_at', now()
        ),
        now()
    );
    
    return true;
    
end;
$$;


ALTER FUNCTION public.delete_site(p_site_id uuid, p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 275 (class 1255 OID 18190)
-- Name: get_issue_id(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issue_id(p_issue_id uuid, p_project_id uuid DEFAULT NULL::uuid) RETURNS TABLE(issue_id uuid, issue_no bigint, issue_title text, issue_description text, status public.issue_status, priority public.priority_level, reporter_id uuid, assignee_id uuid, parent_issue_id uuid, blocking_issue_id uuid, is_private boolean, is_editable boolean, created_at timestamp with time zone, updated_at timestamp with time zone, project_id uuid, project_name text, site_id uuid, site_name text, org_id uuid, org_name text, reporter_name text, assignee_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_has_access boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue'yu bul ve bilgilerini getir
    return query
    select 
        i.issue_id,
        i.issue_no,
        i.issue_title,
        i.issue_description,
        i.status,
        i.priority,
        i.reporter_id,
        i.assignee_id,
        i.parent_issue_id,
        i.blocking_issue_id,
        i.is_private,
        i.is_editable,
        i.created_at,
        i.updated_at,
        p.project_id,
        p.project_name,
        s.site_id,
        s.site_name,
        o.org_id,
        o.org_name,
        concat(u_reporter.user_name, ' ', u_reporter.user_last_name) as reporter_name,
        concat(u_assignee.user_name, ' ', u_assignee.user_last_name) as assignee_name
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    join organizations o on o.org_id = s.org_id
    left join users u_reporter on u_reporter.user_id = i.reporter_id
    left join users u_assignee on u_assignee.user_id = i.assignee_id
    where i.issue_id = p_issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null
        and o.deleted_at is null
        and (p_project_id is null or i.project_id = p_project_id);
    
    -- 3. Issue bulunamadıysa hata fırlat
    if not found then
        raise exception 'Issue not found or already deleted';
    end if;
end;
$$;


ALTER FUNCTION public.get_issue_id(p_issue_id uuid, p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 290 (class 1255 OID 18191)
-- Name: get_issues(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issues(p_project_id uuid DEFAULT NULL::uuid) RETURNS TABLE(issue_id uuid, issue_title text, issue_no bigint, status public.issue_status, priority public.priority_level, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
begin
    v_user_id := auth_current_user_id();

    IF v_user_id is null THEN
        raise EXCEPTION 'User not authenticated';
    end if;

    return query 
    SELECT DISTINCT
        i.issue_id,
        i.issue_title,
        i.issue_no,
        i.status,
        i.priority,
        i.created_at
    FROM issues i
    WHERE i.deleted_at IS NULL
        AND (p_project_id IS NULL OR i.project_id = p_project_id)
        AND (
            -- Kullanıcı issue'nun üyesi mi?
            EXISTS (
                SELECT 1 FROM issue_memberships im
                WHERE im.issue_id = i.issue_id
                    AND im.user_id = v_user_id
                    AND im.membership_is_active = true
                    AND im.deleted_at IS NULL
            )
            OR
            -- Kullanıcı issue'nun reporter'ı mı?
            i.reporter_id = v_user_id
            OR
            -- Kullanıcı issue'ya assigne edilmiş mi?
            i.assignee_id = v_user_id
        )
    ORDER BY i.issue_no;
end;
$$;


ALTER FUNCTION public.get_issues(p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 250 (class 1255 OID 18213)
-- Name: get_organization_id(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_organization_id(p_org_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN

    -- current user
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- memberships check
    if not exists (
        select 
            1
        from 
            organization_memberships as om
        where 
            om.org_id = p_org_id
            and
            om.user_id = v_user_id
            and
            om.deleted_at is null
            AND
            om.membership_is_active = true
    )
    THEN
        RAISE EXCEPTION 'permission_denied';
    end if;

    -- return org_id
    select
        o.org_id
    into v_org_id
    from organizations o
    where o.org_id = p_org_id
    and o.deleted_at is null;

    return v_org_id;

end;
$$;


ALTER FUNCTION public.get_organization_id(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 18024)
-- Name: get_organizations(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_organizations(p_org_id uuid) RETURNS TABLE(org_id uuid, org_name text, org_description text, slug text, org_status text, created_at timestamp with time zone, created_by uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN

    -- current user
    v_user_id = auth_current_user_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- memberships check
    if not exists (
        select 
            1
        from 
            organization_memberships as om
        where 
            om.org_id = p_org_id
            and
            om.user_id = v_user_id
            and
            om.deleted_at is null
            AND
            om.membership_is_active = true
    )
    THEN
        RAISE EXCEPTION 'permission_denied';
    end if;

    return query
    select
        o.org_id,
        o.org_name,
        o.org_description,
        o.slug,
        o.org_status,
        o.created_at,
        o.created_by
    from organizations o
    where o.org_id = p_org_id
    and o.deleted_at is null;

end;
$$;


ALTER FUNCTION public.get_organizations(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 302 (class 1255 OID 18200)
-- Name: get_projects(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_projects(p_site_id uuid) RETURNS TABLE(project_id uuid, project_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth_current_user_id();

    if v_user_id is null THEN
        raise exception 'User not authenticated';
    end if;

    return query
    select p.project_id, p.project_name
    FROM   project as p
    INNER JOIN  project_memberships pm on pm.project_id = p.project_id
    WHERE
        p.deleted_at is NULL
        AND
        (p_site_id is null or p.site_id = p_site_id)
        AND
        pm.user_id = v_user_id
        AND
        pm.membership_is_active = TRUE
        AND
        pm.deleted_at is NULL
    ORDER BY p.project_name;
end;
$$;


ALTER FUNCTION public.get_projects(p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 381 (class 1255 OID 18199)
-- Name: get_site_id(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_site_id(p_site_id uuid, p_project_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_site_id uuid;
    v_project_id uuid;
BEGIN

    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception  'User not authenticated';
    end if;

    if not exists 
    (
        select
            1
        from
            project_memberships as pm
        where 
            pm.site_id = p_site_id
            AND
            pm.project_id = p_project_id
            AND
            pm.user_id = v_user_id
            AND
            pm.deleted_at is NULL
            AND
            pm.membership_is_active = true
    )
    THEN
        raise exception 'Err code: Permission denied';
    end if;

    SELECT
        p.project_id
    into
        v_project_id
    from
        projects as p
    where
        p.project_id = p_project_id
        AND
        p.site_id = p_site_id
        AND
        p.deleted_at is NULL;

    return v_project_id;
end;

$$;


ALTER FUNCTION public.get_site_id(p_site_id uuid, p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 293 (class 1255 OID 18208)
-- Name: get_sites(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_sites(p_org_id uuid) RETURNS TABLE(site_id uuid, site_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth_current_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    RETURN QUERY
    SELECT s.site_id, s.site_name
    FROM sites s
    INNER JOIN site_memberships sm ON s.site_id = sm.site_id
    WHERE s.deleted_at IS NULL
      AND (p_org_id IS NULL OR s.org_id = p_org_id)
      AND sm.user_id = v_user_id
      AND sm.membership_is_active = TRUE
      AND sm.deleted_at IS NULL
    ORDER BY s.site_name;
END;$$;


ALTER FUNCTION public.get_sites(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 385 (class 1255 OID 18192)
-- Name: invite_issue(uuid, uuid, uuid, uuid, uuid, public.issue_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.invite_issue(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_project_id uuid, p_issue_id uuid, p_issue_role public.issue_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_is_issue_private boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_user_in_org boolean;
    v_user_in_site boolean;
    v_user_in_project boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
BEGIN
    -- 1. Aktör kontrolü
    v_actor := auth_current_user_id();
    
    IF v_actor IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 2. Friendship code ile hedef kullanıcıyı bul
    SELECT user_id INTO v_target_user_id
    FROM users
    WHERE user_friendship_code = p_friendship_code
        AND deleted_at IS NULL
        AND user_is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid friendship code or user not found';
    END IF;

    -- 3. Issue, project, site bilgilerini ve private durumlarını al
    SELECT 
        i.is_private as issue_is_private,
        p.is_private as project_is_private,
        s.is_private as site_is_private
    INTO 
        v_is_issue_private,
        v_is_project_private,
        v_is_site_private
    FROM issues i
    JOIN projects p ON p.project_id = i.project_id
    JOIN sites s ON s.site_id = p.site_id
    WHERE i.issue_id = p_issue_id
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;
    
    IF v_is_issue_private IS NULL THEN
        RAISE EXCEPTION 'Issue not found';
    END IF;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 5. Yetki kontrolü
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site, project, issue private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true OR v_is_issue_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot invite users to private sites, projects, or issues';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this issue';
    END IF;

    -- 6. Hedef kullanıcının organization'da üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = p_org_id
            AND om.user_id = v_target_user_id
            AND om.membership_is_active = true
            AND om.deleted_at IS NULL
    ) INTO v_user_in_org;
    
    IF NOT v_user_in_org THEN
        RAISE EXCEPTION 'User must be an active member of the organization first';
    END IF;

    -- 7. Hedef kullanıcının site'de üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM site_memberships sm
        WHERE sm.site_id = p_site_id
            AND sm.user_id = v_target_user_id
            AND sm.membership_is_active = true
            AND sm.deleted_at IS NULL
    ) INTO v_user_in_site;
    
    IF NOT v_user_in_site THEN
        RAISE EXCEPTION 'User must be an active member of the site first';
    END IF;

    -- 8. Hedef kullanıcının project'te üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM project_memberships pm
        WHERE pm.project_id = p_project_id
            AND pm.user_id = v_target_user_id
            AND pm.membership_is_active = true
            AND pm.deleted_at IS NULL
    ) INTO v_user_in_project;
    
    IF NOT v_user_in_project THEN
        RAISE EXCEPTION 'User must be an active member of the project first';
    END IF;

    -- 9. Zaten issue membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM issue_memberships im
        WHERE im.issue_id = p_issue_id
            AND im.user_id = v_target_user_id
            AND im.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this issue';
    END IF;

    -- 10. Issue membership ekle
    INSERT INTO issue_memberships (
        issue_id,
        user_id,
        role,
        membership_is_active,
        created_at,
        updated_at
    )
    VALUES (
        p_issue_id,
        v_target_user_id,
        p_issue_role,
        true,
        now(),
        now()
    );

    -- 11. Audit log
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
        v_actor,
        'issue_membership',
        p_issue_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'issue_id', p_issue_id,
            'project_id', p_project_id,
            'site_id', p_site_id,
            'role', p_issue_role,
            'invited_by', v_actor
        ),
        now()
    );
    
END;
$$;


ALTER FUNCTION public.invite_issue(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_project_id uuid, p_issue_id uuid, p_issue_role public.issue_role) OWNER TO postgres;

--
-- TOC entry 281 (class 1255 OID 18201)
-- Name: invite_project(uuid, uuid, uuid, uuid, public.project_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.invite_project(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_project_id uuid, p_project_role public.project_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_is_project_private boolean;
    v_user_in_org boolean;
    v_user_in_site boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
BEGIN
    -- 1. Aktör kontrolü
    v_actor := auth_current_user_id();
    
    IF v_actor IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 2. Friendship code ile hedef kullanıcıyı bul
    SELECT user_id INTO v_target_user_id
    FROM users
    WHERE user_friendship_code = p_friendship_code
        AND deleted_at IS NULL
        AND user_is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid friendship code or user not found';
    END IF;

    -- 3. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 4. Yetki kontrolü - en az birine sahip olmalı
    IF NOT (v_is_org_owner OR v_is_org_admin OR v_is_site_admin OR v_is_project_admin) THEN
        RAISE EXCEPTION 'Permission denied: Only org owner, org admin, site admin, or project admin can invite users';
    END IF;

    -- 5. Project'in private olup olmadığını kontrol et
    SELECT is_private INTO v_is_project_private
    FROM projects
    WHERE project_id = p_project_id
        AND deleted_at IS NULL;
    
    IF v_is_project_private IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

     -- 6. Yetki kontrolü (basit ve net)
    IF v_is_project_private = true THEN
        -- Özel proje: sadece org_owner veya project_admin
        IF NOT (v_is_org_owner OR v_is_project_admin) THEN
            RAISE EXCEPTION 'Permission denied: Only org owner or project admin can invite users to private projects';
        END IF;
    ELSE
        -- Herkese açık proje: org_owner, project_admin, site_admin, org_admin yetkili
        IF NOT (v_is_org_owner OR v_is_project_admin OR v_is_site_admin OR v_is_org_admin) THEN
            RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this project';
        END IF;
    END IF;



    -- 7. Hedef kullanıcının organization'da üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = p_org_id
            AND om.user_id = v_target_user_id
            AND om.membership_is_active = true
            AND om.deleted_at IS NULL
    ) INTO v_user_in_org;
    
    IF NOT v_user_in_org THEN
        RAISE EXCEPTION 'User must be an active member of the organization first';
    END IF;

    -- 8. Hedef kullanıcının site'de üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM site_memberships sm
        WHERE sm.site_id = p_site_id
            AND sm.user_id = v_target_user_id
            AND sm.membership_is_active = true
            AND sm.deleted_at IS NULL
    ) INTO v_user_in_site;
    
    IF NOT v_user_in_site THEN
        RAISE EXCEPTION 'User must be an active member of the site first';
    END IF;

    -- 9. Zaten project membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM project_memberships pm
        WHERE pm.project_id = p_project_id
            AND pm.user_id = v_target_user_id
            AND pm.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this project';
    END IF;

    -- 10. Project membership ekle
    INSERT INTO project_memberships (
        project_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        p_project_id,
        v_target_user_id,
        p_project_role,
        v_actor,
        true,
        now(),
        now(),
        now()
    );

    -- 11. Audit log
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
        v_actor,
        'project_membership',
        p_project_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'project_id', p_project_id,
            'site_id', p_site_id,
            'role', p_project_role,
            'invited_by', v_actor
        ),
        now()
    );
    
END;
$$;


ALTER FUNCTION public.invite_project(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_project_id uuid, p_project_role public.project_role) OWNER TO postgres;

--
-- TOC entry 360 (class 1255 OID 18209)
-- Name: invite_site(uuid, uuid, uuid, public.site_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role public.site_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_is_site_private boolean;
    v_user_in_org boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
BEGIN
    -- 1. Aktör kontrolü
    v_actor := auth_current_user_id();
    
    IF v_actor IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 2. Friendship code ile hedef kullanıcıyı bul
    SELECT user_id INTO v_target_user_id
    FROM users
    WHERE user_friendship_code = p_friendship_code
        AND deleted_at IS NULL
        AND user_is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid friendship code or user not found';
    END IF;

    -- 3. Yetki kontrolleri için flag'leri al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);

    -- 4. Yetki kontrolü - en az birine sahip olmalı
    IF NOT (v_is_org_owner OR v_is_org_admin OR v_is_site_admin) THEN
        RAISE EXCEPTION 'Permission denied: Only org owner, org admin, or site admin can invite users';
    END IF;

    -- 5. Site'in private olup olmadığını kontrol et
    SELECT is_private INTO v_is_site_private
    FROM sites
    WHERE site_id = p_site_id
        AND deleted_at IS NULL;
    
    -- 6. Yetki kontrolü 
    -- Yetkisiz durumları kontrol et, yetkili durumlar otomatik geçer
    IF NOT (v_is_org_owner OR (v_is_org_admin AND v_is_site_admin)) THEN
        -- Yetkili değil, şimdi neden yetkisiz olduğunu bul
        IF v_is_org_admin AND NOT v_is_site_admin AND v_is_site_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot invite users to private sites';
        ELSE
            RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this site';
        END IF;
    END IF;

    -- 7. Hedef kullanıcının organization'da üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = p_org_id
            AND om.user_id = v_target_user_id
            AND om.membership_is_active = true
            AND om.deleted_at IS NULL
    ) INTO v_user_in_org;
    
    IF NOT v_user_in_org THEN
        RAISE EXCEPTION 'User must be an active member of the organization first';
    END IF;

    -- 8. Zaten site membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM site_memberships sm
        WHERE sm.site_id = p_site_id
            AND sm.user_id = v_target_user_id
            AND sm.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this site';
    END IF;

    -- 9. Site membership ekle
    INSERT INTO site_memberships (
        site_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        p_site_id,
        v_target_user_id,
        p_site_role,
        v_actor,
        true,
        now(),
        now(),
        now()
    );

    -- 10. Audit log
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
        v_actor,
        'site_membership',
        p_site_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'site_id', p_site_id,
            'role', p_site_role,
            'invited_by', v_actor
        ),
        now()
    );
END;
$$;


ALTER FUNCTION public.invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role public.site_role) OWNER TO postgres;

--
-- TOC entry 318 (class 1255 OID 18193)
-- Name: list_issues(uuid, public.issue_status, public.priority_level, uuid, uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_issues(p_project_id uuid DEFAULT NULL::uuid, p_status public.issue_status DEFAULT NULL::public.issue_status, p_priority public.priority_level DEFAULT NULL::public.priority_level, p_assignee_id uuid DEFAULT NULL::uuid, p_reporter_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(issue_id uuid, issue_no bigint, issue_title text, status public.issue_status, priority public.priority_level, reporter_id uuid, assignee_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, comment_count bigint, member_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Eğer project_id verilmişse, o projenin bilgilerini al
    if p_project_id is not null then
        select 
            p.site_id,
            p.is_private,
            s.org_id,
            s.is_private
        into 
            v_site_id,
            v_is_project_private,
            v_org_id,
            v_is_site_private
        from projects p
        join sites s on s.site_id = p.site_id
        where p.project_id = p_project_id
            and p.deleted_at is null
            and s.deleted_at is null;
        
        if v_site_id is null then
            raise exception 'Project not found';
        end if;

        -- 3. Yetki flag'lerini al
        v_is_org_owner := auth_is_org_owner(v_org_id);
        v_is_org_admin := auth_is_org_admin(v_org_id);
        v_is_site_admin := auth_is_site_admin(v_site_id);
        v_is_project_admin := auth_is_project_admin(p_project_id);
    end if;

    -- 4. Listeleme sorgusu
    return query
    select distinct
        i.issue_id,
        i.issue_no,
        i.issue_title,
        i.status,
        i.priority,
        i.reporter_id,
        i.assignee_id,
        i.created_at,
        i.updated_at,
        coalesce(
            (
                select count(*) 
                from issue_comments ic 
                where ic.issue_id = i.issue_id 
                    and ic.deleted_at is null
            ), 0
        ) as comment_count,
        coalesce(
            (
                select count(*) 
                from issue_memberships im 
                where im.issue_id = i.issue_id 
                    and im.membership_is_active = true 
                    and im.deleted_at is null
            ), 0
        ) as member_count
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null
        
        -- Project filtresi
        and (p_project_id is null or i.project_id = p_project_id)
        
        -- Status filtresi
        and (p_status is null or i.status = p_status)
        
        -- Priority filtresi
        and (p_priority is null or i.priority = p_priority)
        
        -- Assignee filtresi
        and (p_assignee_id is null or i.assignee_id = p_assignee_id)
        
        -- Reporter filtresi
        and (p_reporter_id is null or i.reporter_id = p_reporter_id)
        
        -- Search filtresi (title ve description'da ara)
        and (
            p_search is null 
            or i.issue_title ilike '%' || p_search || '%'
            or i.issue_description ilike '%' || p_search || '%'
        )
        
        -- Yetki filtresi
        and (
            -- Org owner: her şeyi görebilir
            (p_project_id is not null and v_is_org_owner = true)
            
            or
            
            -- Site admin: her şeyi görebilir
            (p_project_id is not null and v_is_site_admin = true)
            
            or
            
            -- Project admin: her şeyi görebilir
            (p_project_id is not null and v_is_project_admin = true)
            
            or
            
            -- Org admin: sadece public site + public project + public issue görebilir
            (
                p_project_id is not null 
                and v_is_org_admin = true 
                and v_is_site_private = false 
                and v_is_project_private = false 
                and i.is_private = false
            )
            
            or
            
            -- Issue membership'i olan (contributor, reviewer, watcher)
            exists (
                select 1 
                from issue_memberships im
                where im.issue_id = i.issue_id
                    and im.user_id = v_user_id
                    and im.membership_is_active = true
                    and im.deleted_at is null
            )
            
            or
            
            -- Reporter: kendi açtığı issue'lar
            i.reporter_id = v_user_id
            
            or
            
            -- Assignee: kendine atanan issue'lar
            i.assignee_id = v_user_id
        )
    order by i.issue_no desc
    limit p_limit
    offset p_offset;
end;
$$;


ALTER FUNCTION public.list_issues(p_project_id uuid, p_status public.issue_status, p_priority public.priority_level, p_assignee_id uuid, p_reporter_id uuid, p_search text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- TOC entry 336 (class 1255 OID 18202)
-- Name: list_projects(uuid, public.project_status, text, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_projects(p_site_id uuid DEFAULT NULL::uuid, p_status public.project_status DEFAULT NULL::public.project_status, p_search text DEFAULT NULL::text, p_is_private boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(project_id uuid, project_name text, project_description text, slug text, project_status public.project_status, is_private boolean, created_at timestamp with time zone, created_by uuid, completed_at timestamp with time zone, completed_by uuid, site_id uuid, site_name text, member_count bigint, issue_count bigint, requirement_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_site_org_id uuid;
    v_site_is_private boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Eğer site_id verilmişse, o sitenin bilgilerini al
    if p_site_id is not null then
        select 
            s.org_id,
            s.is_private
        into 
            v_site_org_id,
            v_site_is_private
        from sites s
        where s.site_id = p_site_id
            and s.deleted_at is null;
        
        if v_site_org_id is null then
            raise exception 'Site not found';
        end if;

        -- Yetki flag'lerini al
        v_is_org_owner := auth_is_org_owner(v_site_org_id);
        v_is_org_admin := auth_is_org_admin(v_site_org_id);
        v_is_site_admin := auth_is_site_admin(p_site_id);
    end if;

    -- 3. Listeleme sorgusu
    return query
    select distinct
        p.project_id,
        p.project_name,
        p.project_description,
        p.slug,
        p.project_status,
        p.is_private,
        p.created_at,
        p.created_by,
        p.completed_at,
        p.completed_by,
        s.site_id,
        s.site_name,
        -- Üye sayısı
        coalesce(
            (
                select count(*)
                from project_memberships pm
                where pm.project_id = p.project_id
                    and pm.membership_is_active = true
                    and pm.deleted_at is null
            ), 0
        ) as member_count,
        -- Issue sayısı
        coalesce(
            (
                select count(*)
                from issues i
                where i.project_id = p.project_id
                    and i.deleted_at is null
            ), 0
        ) as issue_count,
        -- Requirement sayısı
        coalesce(
            (
                select count(*)
                from project_requirements pr
                where pr.project_id = p.project_id
                    and pr.deleted_at is null
            ), 0
        ) as requirement_count
    from projects p
    join sites s on s.site_id = p.site_id
    where p.deleted_at is null
        and s.deleted_at is null
        
        -- Site filtresi
        and (p_site_id is null or p.site_id = p_site_id)
        
        -- Status filtresi
        and (p_status is null or p.project_status = p_status)
        
        -- Private filtresi
        and (p_is_private is null or p.is_private = p_is_private)
        
        -- Search filtresi (name, description, slug'da ara)
        and (
            p_search is null
            or p.project_name ilike '%' || p_search || '%'
            or p.project_description ilike '%' || p_search || '%'
            or p.slug ilike '%' || p_search || '%'
        )
        
        -- Yetki filtresi
        and (
            -- Org owner: her şeyi görebilir
            (p_site_id is not null and v_is_org_owner = true)
            
            or
            
            -- Site admin: her şeyi görebilir
            (p_site_id is not null and v_is_site_admin = true)
            
            or
            
            -- Project admin: her şeyi görebilir
            auth_is_project_admin(p.project_id) = true
            
            or
            
            -- Org admin: sadece public site + public project görebilir
            (
                p_site_id is not null
                and v_is_org_admin = true
                and v_site_is_private = false
                and p.is_private = false
            )
            
            or
            
            -- Project membership'i olan (contributor, reviewer, viewer)
            exists (
                select 1
                from project_memberships pm
                where pm.project_id = p.project_id
                    and pm.user_id = v_user_id
                    and pm.membership_is_active = true
                    and pm.deleted_at is null
            )
        )
    order by p.created_at desc
    limit p_limit
    offset p_offset;
end;
$$;


ALTER FUNCTION public.list_projects(p_site_id uuid, p_status public.project_status, p_search text, p_is_private boolean, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- TOC entry 368 (class 1255 OID 18210)
-- Name: list_sites(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_sites(p_org_id uuid DEFAULT NULL::uuid) RETURNS TABLE(site_id uuid, site_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth_current_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;


    RETURN QUERY
    SELECT s.site_id, s.site_name
    FROM sites s
    INNER JOIN site_memberships sm ON s.site_id = sm.site_id
    WHERE s.deleted_at IS NULL
      AND (p_org_id IS NULL OR s.org_id = p_org_id)
      AND sm.user_id = v_user_id
      AND sm.membership_is_active = TRUE
      AND sm.deleted_at IS NULL
    ORDER BY s.site_name;
END;$$;


ALTER FUNCTION public.list_sites(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 374 (class 1255 OID 18023)
-- Name: list_user_organizations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_user_organizations() RETURNS TABLE(org_id uuid, org_name text, slug text, org_status text, joined_at timestamp with time zone, role public.org_role)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
        --current user
        v_user_id := auth_current_user();

        if v_user_id is null then 
            raise exception 'user not authenticated';
        end if;

        return query
        SELECT
            o.org_id,
            o.org_name,
            o.slug,
            o.org_status,
            om.joined_at, 
            om.role
        FROM
            organizations as o
        JOIN 
            organization_memberships as om on o.org_id = om.org_id
        WHERE
            om.user_id = o.user_id
            AND
            om.membership_is_active = 1
            AND
            om.deleted_at is NULL
            AND
            o.deleted_at is NULL
        ORDER BY
            o.created_at;
end;
$$;


ALTER FUNCTION public.list_user_organizations() OWNER TO postgres;

--
-- TOC entry 259 (class 1255 OID 18212)
-- Name: soft_delete_organization(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.soft_delete_organization(p_org_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ 
DECLARE
    v_user_id uuid;
BEGIN

    -- user 
    v_user_id := auth_current_user_id();

    if v_user_id is null THEN
        raise exception 'user not authenticated';
    end if;

    -- owner kontrol 
    if not auth_is_org_owner(p_org_id) then
        raise exception 'only owner can delete organization';
    end if;


    -- zaten sılınmısmı check
    if exists (
        select 
            1
        from 
            organizations
        where 
            org_id = p_org_id
            AND
            deleted_at is not NULL
    ) THEN
        raise exception 'organization already deleted';
    end if;

    -- soft delete
    update organizations    
    set deleted_at = now()
    where org_id = p_org_id;

end;
$$;


ALTER FUNCTION public.soft_delete_organization(p_org_id uuid) OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 18292)
-- Name: trg_assets_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_assets_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
    new.updated_at := now();
    return new;
end;
$$;


ALTER FUNCTION public.trg_assets_update() OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 18286)
-- Name: trg_issue_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_issue_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
begin
    -- 1. Kullanıcıyı al
    v_user_id := auth_current_user_id();
    
    -- 2. INSERT işlemi
    if tg_op = 'INSERT' then
        insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
        values (new.issue_id, v_user_id, 'issue_created', null, new.issue_title, now());
        return new;
    
    -- 3. UPDATE işlemi
    elsif tg_op = 'UPDATE' then
        -- issue_title değişti mi?
        if old.issue_title != new.issue_title then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'issue_title', old.issue_title, new.issue_title, now());
        end if;
        
        -- issue_description değişti mi?
        if old.issue_description != new.issue_description then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'issue_description', old.issue_description, new.issue_description, now());
        end if;
        
        -- status değişti mi?
        if old.status != new.status then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'status', old.status::text, new.status::text, now());
        end if;
        
        -- priority değişti mi?
        if old.priority != new.priority then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'priority', old.priority::text, new.priority::text, now());
        end if;
        
        -- assignee_id değişti mi?
        if old.assignee_id != new.assignee_id then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'assignee_id', old.assignee_id::text, new.assignee_id::text, now());
        end if;
        
        -- is_private değişti mi?
        if old.is_private != new.is_private then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'is_private', old.is_private::text, new.is_private::text, now());
        end if;
        
        return new;
    
    -- 4. DELETE işlemi
    elsif tg_op = 'DELETE' then
        insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
        values (old.issue_id, v_user_id, 'deleted', old.issue_title, null, now());
        return old;
    end if;
    
    return null;
end;
$$;


ALTER FUNCTION public.trg_issue_activity() OWNER TO postgres;

--
-- TOC entry 273 (class 1255 OID 18289)
-- Name: trg_issue_memberships_role_guard(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_issue_memberships_role_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_org_id uuid;
    v_project_id uuid;
    v_site_id uuid;           -- 👈 EKSİK OLAN SATIR
    v_org_role org_role;
    v_project_role project_role;
begin
    -- 1. Issue'nun bağlı olduğu proje ve organization'ı bul
    select 
        i.project_id,
        p.site_id,
        s.org_id
    into 
        v_project_id,
        v_site_id,
        v_org_id
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.issue_id = new.issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_org_id is null then
        raise exception 'Organization not found for issue %', new.issue_id;
    end if;

    -- 2. Kullanıcının organization'daki rolünü al
    select om.role into v_org_role
    from organization_memberships om
    where om.org_id = v_org_id
        and om.user_id = new.user_id
        and om.membership_is_active = true
        and om.deleted_at is null;

    if v_org_role is null then
        raise exception 'User % is not an active member of organization %', new.user_id, v_org_id;
    end if;

    -- 3. Kullanıcının project'teki rolünü al (varsa)
    select pm.role into v_project_role
    from project_memberships pm
    where pm.project_id = v_project_id
        and pm.user_id = new.user_id
        and pm.membership_is_active = true
        and pm.deleted_at is null;

    -- 4. Rol atama kuralları
    -- Issue role'leri: contributor, reviewer, watcher
    
    -- Org owner: her rolü atayabilir
    if v_org_role = 'owner' then
        -- devam et
        null;
    
    -- Org admin: sadece site ve project private değilse atayabilir
    elsif v_org_role = 'admin' then
        -- private kontrolü yapılacak (opsiyonel)
        null;
    
    -- Project admin: contributor, reviewer, watcher atayabilir
    elsif v_project_role = 'project_admin' then
        -- devam et
        null;
    
    -- Project contributor: sadece watcher atayabilir
    elsif v_project_role = 'contributor' then
        if new.role != 'watcher' then
            raise exception 'Project contributor can only assign watcher role to issues';
        end if;
    
    -- Project reviewer: sadece watcher atayabilir
    elsif v_project_role = 'reviewer' then
        if new.role != 'watcher' then
            raise exception 'Project reviewer can only assign watcher role to issues';
        end if;
    
    -- Diğerleri: yetkisiz
    else
        raise exception 'Permission denied: User cannot assign roles to this issue';
    end if;

    return new;
end;
$$;


ALTER FUNCTION public.trg_issue_memberships_role_guard() OWNER TO postgres;

--
-- TOC entry 292 (class 1255 OID 18303)
-- Name: trg_prevent_issue_delete_if_has_children(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevent_issue_delete_if_has_children() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_child_count bigint;
begin
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_child_count
        from issues
        where parent_issue_id = old.issue_id
            and deleted_at is null;
        
        if v_child_count > 0 then
            raise exception 'Cannot delete issue. It has % child issue(s). Please delete or move child issues first.', v_child_count;
        end if;
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION public.trg_prevent_issue_delete_if_has_children() OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 18301)
-- Name: trg_prevent_org_delete_if_has_sites(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevent_org_delete_if_has_sites() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_site_count bigint;
begin
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_site_count
        from sites
        where org_id = old.org_id
            and deleted_at is null;
        
        if v_site_count > 0 then
            raise exception 'Cannot delete organization. It has % active site(s). Please delete or archive sites first.', v_site_count;
        end if;
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION public.trg_prevent_org_delete_if_has_sites() OWNER TO postgres;

--
-- TOC entry 354 (class 1255 OID 18299)
-- Name: trg_prevent_project_delete_if_has_issues(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevent_project_delete_if_has_issues() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_issue_count bigint;
begin
    -- Sadece soft delete işleminde kontrol et
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_issue_count
        from issues
        where project_id = old.project_id
            and deleted_at is null;
        
        if v_issue_count > 0 then
            raise exception 'Cannot delete project. It has % active issue(s). Please delete or close issues first.', v_issue_count;
        end if;
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION public.trg_prevent_project_delete_if_has_issues() OWNER TO postgres;

--
-- TOC entry 367 (class 1255 OID 18297)
-- Name: trg_prevent_site_delete_if_has_projects(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevent_site_delete_if_has_projects() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_project_count bigint;
begin
    -- Sadece soft delete işleminde kontrol et (deleted_at dolduruluyorsa)
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_project_count
        from projects
        where site_id = old.site_id
            and deleted_at is null;
        
        if v_project_count > 0 then
            raise exception 'Cannot delete site. It has % active project(s). Please delete or archive projects first.', v_project_count;
        end if;
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION public.trg_prevent_site_delete_if_has_projects() OWNER TO postgres;

--
-- TOC entry 373 (class 1255 OID 17989)
-- Name: trg_project_memberships_role_guard(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_project_memberships_role_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_org_id uuid;
    v_org_role org_role;
begin
    -- 1. Projenin bağlı olduğu organization'ı bul
    select s.org_id into v_org_id
    from projects p
    join sites s on s.site_id = p.site_id
    where p.project_id = new.project_id
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_org_id is null then
        raise exception 'Organization not found for project %', new.project_id;
    end if;

    -- 2. Kullanıcının organization'daki rolünü al
    select om.role into v_org_role
    from organization_memberships om
    where om.org_id = v_org_id
        and om.user_id = new.user_id
        and om.membership_is_active = true
        and om.deleted_at is null;

    if v_org_role is null then
        raise exception 'User % is not an active member of organization %', new.user_id, v_org_id;
    end if;

    -- 3. Rol atama kontrolü 
    if not can_assign_project_role(v_org_role, new.role) then
        raise exception 'Role escalation blocked: org_role=% cannot be assigned project_role=%', v_org_role, new.role;
    end if;

    return new;
end;
$$;


ALTER FUNCTION public.trg_project_memberships_role_guard() OWNER TO postgres;

--
-- TOC entry 346 (class 1255 OID 18097)
-- Name: trg_site_memberships_role_guard(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_site_memberships_role_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_org_id uuid;
    v_org_role org_role;

BEGIN
    
    
    IF not EXISTS
        (
            select 
                1
            from 
                organizations as o
            where
                o.org_id = v_org_id   
        )
        THEN
            RAISE EXCEPTION 'Its not already organization %',v_org_id;
    end if;

    

    SELECT
        s.org_id
    INTO    
        v_org_id
    from 
        sites as s
    where
        s.site_id = NEW.site_id;
    



    if v_org_id is null THEN
        raise exception 'Organization not found for site %',NEW.site_id;
    end if;

    SELECT
        om.role
    into 
        v_org_role
    from 
        organization_memberships as om 
    where 
        om.org_id = v_org_id
        AND
        om.user_id = NEW.user_id
        AND
        om.membership_is_active = true
        AND
        om.deleted_at is null;

    
    if v_org_role is null THEN
        raise exception 'User % is not an active member of organization %',
                        NEW.user_id, v_org_id;
    end if;


    if v_org_role = 'viewer' AND NEW.role != 'viewer' THEN
        raise EXCEPTION 'Role escalation blocked: org_role= viewer cannot be assigned site_role = %',
                        NEW.role;

    end if;

    return NEW;

END;
$$;


ALTER FUNCTION public.trg_site_memberships_role_guard() OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 18195)
-- Name: update_issues(uuid, text, text, public.issue_status, public.priority_level, uuid, boolean, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_issues(p_issue_id uuid, p_issue_title text DEFAULT NULL::text, p_issue_description text DEFAULT NULL::text, p_status public.issue_status DEFAULT NULL::public.issue_status, p_priority public.priority_level DEFAULT NULL::public.priority_level, p_assignee_id uuid DEFAULT NULL::uuid, p_is_private boolean DEFAULT NULL::boolean, p_project_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_old_issue_title text;
    v_old_issue_description text;
    v_old_status issue_status;
    v_old_priority priority_level;
    v_old_assignee_id uuid;
    v_old_is_private boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_issue_reporter_id uuid;
    v_issue_assignee_id uuid;
    v_update_parts text[];
    v_update_query text;
    v_changes jsonb;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue bilgilerini al
    select 
        i.issue_title,
        i.issue_description,
        i.status,
        i.priority,
        i.assignee_id,
        i.is_private,
        i.reporter_id,
        p.site_id,
        p.is_private,
        s.org_id,
        s.is_private
    into 
        v_old_issue_title,
        v_old_issue_description,
        v_old_status,
        v_old_priority,
        v_old_assignee_id,
        v_old_is_private,
        v_issue_reporter_id,
        v_site_id,
        v_is_project_private,
        v_org_id,
        v_is_site_private
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.issue_id = p_issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_site_id is null then
        raise exception 'Issue not found or already deleted';
    end if;

    -- 3. Project ID kontrolü (parametre varsa)
    if p_project_id is not null and p_project_id != (select project_id from issues where issue_id = p_issue_id) then
        raise exception 'Issue does not belong to the specified project';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin((select project_id from issues where issue_id = p_issue_id));
    v_issue_assignee_id := v_old_assignee_id;

    -- 5. Yetki kontrolü
    -- Tam yetkililer: org_owner, site_admin, project_admin
    if v_is_org_owner or v_is_site_admin or v_is_project_admin then
        -- Her şeyi güncelleyebilir
        null;
    
    -- Org admin: sadece public site + public project + public issue
    elsif v_is_org_admin then
        if v_is_site_private = true or v_is_project_private = true or v_old_is_private = true then
            raise exception 'Permission denied: Org admin cannot update issues in private sites, projects, or issues';
        end if;
        -- Her şeyi güncelleyebilir (public ise)
        null;
    
    -- Assignee: sadece status ve priority güncelleyebilir
    elsif v_issue_assignee_id = v_user_id then
        -- Sadece status ve priority dışındaki güncellemeleri engelle
        if p_issue_title is not null 
            or p_issue_description is not null 
            or p_assignee_id is not null 
            or p_is_private is not null then
            raise exception 'Permission denied: Assignee can only update status and priority';
        end if;
    
    -- Reporter: sadece kendi açtığı issue'ları güncelleyebilir (title, description, is_private)
    elsif v_issue_reporter_id = v_user_id then
        -- Sadece izin verilen alanlar dışındaki güncellemeleri engelle
        if p_status is not null or p_priority is not null or p_assignee_id is not null then
            raise exception 'Permission denied: Reporter can only update title, description, and privacy status';
        end if;
    
    else
        raise exception 'Permission denied: You are not authorized to update this issue';
    end if;

    -- 6. Değişiklikleri hazırla (JSONB formatında)
    v_changes := '{}'::jsonb;
    
    if p_issue_title is not null and p_issue_title != v_old_issue_title then
        v_changes := v_changes || jsonb_build_object('issue_title', jsonb_build_object('old', v_old_issue_title, 'new', p_issue_title));
    end if;
    
    if p_issue_description is not null and p_issue_description != v_old_issue_description then
        v_changes := v_changes || jsonb_build_object('issue_description', jsonb_build_object('old', v_old_issue_description, 'new', p_issue_description));
    end if;
    
    if p_status is not null and p_status != v_old_status then
        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_status, 'new', p_status));
    end if;
    
    if p_priority is not null and p_priority != v_old_priority then
        v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', v_old_priority, 'new', p_priority));
    end if;
    
    if p_assignee_id is not null and p_assignee_id != v_old_assignee_id then
        v_changes := v_changes || jsonb_build_object('assignee_id', jsonb_build_object('old', v_old_assignee_id, 'new', p_assignee_id));
    end if;
    
    if p_is_private is not null and p_is_private != v_old_is_private then
        v_changes := v_changes || jsonb_build_object('is_private', jsonb_build_object('old', v_old_is_private, 'new', p_is_private));
    end if;

    -- 7. Güncelleme yoksa çık
    if v_changes = '{}'::jsonb then
        raise exception 'No changes to update';
    end if;

    -- 8. Issue güncelle
    update issues
    set 
        issue_title = coalesce(p_issue_title, issue_title),
        issue_description = coalesce(p_issue_description, issue_description),
        status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        assignee_id = coalesce(p_assignee_id, assignee_id),
        is_private = coalesce(p_is_private, is_private),
        updated_at = now()
    where issue_id = p_issue_id;

    -- 9. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'issue',
        p_issue_id,
        'UPDATE',
        jsonb_build_object(
            'issue_title', v_old_issue_title,
            'issue_description', v_old_issue_description,
            'status', v_old_status,
            'priority', v_old_priority,
            'assignee_id', v_old_assignee_id,
            'is_private', v_old_is_private
        ),
        jsonb_build_object(
            'issue_title', coalesce(p_issue_title, v_old_issue_title),
            'issue_description', coalesce(p_issue_description, v_old_issue_description),
            'status', coalesce(p_status, v_old_status),
            'priority', coalesce(p_priority, v_old_priority),
            'assignee_id', coalesce(p_assignee_id, v_old_assignee_id),
            'is_private', coalesce(p_is_private, v_old_is_private)
        ),
        now()
    );

    return true;
end;
$$;


ALTER FUNCTION public.update_issues(p_issue_id uuid, p_issue_title text, p_issue_description text, p_status public.issue_status, p_priority public.priority_level, p_assignee_id uuid, p_is_private boolean, p_project_id uuid) OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 18021)
-- Name: update_orgzanization(uuid, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_orgzanization(p_org_id uuid, p_org_name text DEFAULT NULL::text, p_org_description text DEFAULT NULL::text, p_slug text DEFAULT NULL::text, p_org_status text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN

    -- user_id
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- member ve viewer update yapamaz
    if not auth_is_org_owner(p_org_id)
        and not auth_is_org_admin(p_org_id) THEN
        raise exception 'permission denied';
    end if;

    if p_org_name is null and length(trim(p_org_name)) = 0 then 
        raise exception 'organization name cannot be empty';
    end if;
    
    if p_org_status is not null 
        and not auth_is_org_owner(p_org_id) THEN
        raise exception 'only owner can update organization status';
    end if;

    update organizations
    SET 
        org_name = COALESCE(trim(p_org_name), org_name),
        org_description =  coalesce(p_org_description, org_description),
        slug = coalesce(p_slug, slug),
        org_status = coalesce(p_org_status, org_status)
    where org_id = p_org_id;

end;
$$;


ALTER FUNCTION public.update_orgzanization(p_org_id uuid, p_org_name text, p_org_description text, p_slug text, p_org_status text) OWNER TO postgres;

--
-- TOC entry 254 (class 1255 OID 18204)
-- Name: update_project_status(uuid, public.project_status, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_project_status(p_project_id uuid, p_new_status public.project_status, p_site_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_project_name text;
    v_project_status project_status;
    v_is_org_owner boolean;
    v_is_project_admin boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Proje var mı ve bilgilerini al
    select 
        p.site_id,
        p.project_name,
        p.project_status,
        s.org_id
    into 
        v_site_id,
        v_project_name,
        v_project_status,
        v_org_id
    from projects p
    join sites s on s.site_id = p.site_id
    where p.project_id = p_project_id
        and p.deleted_at is null;
    
    if v_site_id is null then
        raise exception 'Project not found or already deleted';
    end if;
    
    -- 3. Site ID kontrolü (parametre varsa)
    if p_site_id is not null and p_site_id != v_site_id then
        raise exception 'Project does not belong to the specified site';
    end if;
    
    -- 4. Aynı duruma geçmek istiyorsa hata ver
    if v_project_status = p_new_status then
        raise exception 'Project is already %', v_project_status;
    end if;
    
    -- 5. Durum geçiş kuralları
    if v_project_status = 'archived' then
        raise exception 'Cannot change status of an archived project';
    end if;
    
    if v_project_status = 'completed' and p_new_status != 'active' then
        raise exception 'Completed projects can only be reactivated to active status';
    end if;
    
    -- 6. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);
    
    -- 7. Yetki kontrolü
    if not (v_is_org_owner or v_is_project_admin) then
        raise exception 'Only organization owner or project admin can update project status';
    end if;
    
    -- 8. Duruma göre update işlemi
    if p_new_status = 'completed' then
        update projects
        set 
            project_status = 'completed',
            completed_by = v_user_id,
            completed_at = now(),
            updated_at = now()
        where project_id = p_project_id;
        
    elsif p_new_status = 'active' then
        update projects
        set 
            project_status = 'active',
            completed_by = null,
            completed_at = null,
            updated_at = now()
        where project_id = p_project_id;
        
    elsif p_new_status = 'archived' then
        update projects
        set 
            deleted_at = now(),
            deleted_by = v_user_id,
            project_status = 'archived',
            updated_at = now()
        where project_id = p_project_id;
        
        update project_memberships
        set 
            deleted_at = now(),
            deleted_by = v_user_id,
            membership_is_active = false,
            updated_at = now()
        where project_id = p_project_id
            and deleted_at is null;
        
        update project_requirements
        set 
            deleted_at = now(),
            deleted_by = v_user_id
        where project_id = p_project_id
            and deleted_at is null;
    end if;
    
    -- 9. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'project',
        p_project_id,
        'UPDATE_STATUS',
        jsonb_build_object('project_status', v_project_status),
        jsonb_build_object(
            'project_status', p_new_status,
            'project_name', v_project_name,
            'site_id', v_site_id,
            'updated_by', v_user_id,
            'updated_at', now()
        ),
        now()
    );
    
    return true;
    
end;
$$;


ALTER FUNCTION public.update_project_status(p_project_id uuid, p_new_status public.project_status, p_site_id uuid) OWNER TO postgres;

--
-- TOC entry 345 (class 1255 OID 18211)
-- Name: update_site_status(uuid, public.site_status, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_site_status(p_site_id uuid, p_new_status public.site_status, p_org_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_current_status site_status;
begin
    --  Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    -- Site kontrolü
    select org_id, site_status into v_org_id, v_current_status
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found';
    end if;
    
    --  Organization ID
    if p_org_id is not null then
        v_org_id := get_organization_id(p_org_id);
    else
        v_org_id := get_organization_id(v_org_id);
    end if;
    
    --  Yetki kontrolü
    if not (
        auth_is_org_owner(v_org_id) or 
        auth_is_site_admin(p_site_id)
    ) then
        raise exception 'Only organization owner or site admin can update site status';
    end if;
    
    --  Status güncelleme kuralları
    if p_new_status = v_current_status then
        raise exception 'Site is already %', v_current_status;
    end if;
    
    -- Suspended'dan active'e geçiş yetkisi
    if v_current_status = 'suspended' and p_new_status = 'active' then
        -- admin yetkisi yeterli
        null;
    end if;
    
    update sites
    set 
        site_status = p_new_status,
        updated_at = now()
    where site_id = p_site_id;
    
    --  Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'site',
        p_site_id,
        'UPDATE_STATUS',
        jsonb_build_object('site_status', v_current_status),
        jsonb_build_object('site_status', p_new_status),
        now()
    );
    
    return true;
    
end;
$$;


ALTER FUNCTION public.update_site_status(p_site_id uuid, p_new_status public.site_status, p_org_id uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 18109)
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    api_key_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key_name text NOT NULL,
    api_key text NOT NULL,
    key_hash text NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17945)
-- Name: application_bugs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.application_bugs OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 18136)
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    verification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email public.citext NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 18215)
-- Name: issue_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issue_activity (
    activity_id uuid DEFAULT gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid,
    field_name text NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.issue_activity OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17918)
-- Name: issue_assets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.issue_assets OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17840)
-- Name: issue_memberships; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.issue_memberships OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17795)
-- Name: issues; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.issues OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17612)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17697)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17669)
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
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
    deleted_by uuid,
    is_private boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17590)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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
    deleted_by uuid,
    email_verified_at timestamp with time zone,
    email_verification_token text,
    password_reset_token text,
    password_reset_expires_at timestamp with time zone,
    two_factor_secret text,
    two_factor_enabled boolean DEFAULT false,
    last_password_change_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 18305)
-- Name: issue_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.issue_summary AS
 SELECT i.issue_id,
    i.issue_no,
    i.issue_title,
    i.issue_description,
    i.status,
    i.priority,
    i.is_private,
    i.is_editable,
    i.created_at,
    i.updated_at,
    i.reporter_id,
    concat(r.user_name, ' ', r.user_last_name) AS reporter_name,
    r.user_email AS reporter_email,
    i.assignee_id,
    concat(a.user_name, ' ', a.user_last_name) AS assignee_name,
    a.user_email AS assignee_email,
    i.parent_issue_id,
    parent.issue_title AS parent_issue_title,
    parent.issue_no AS parent_issue_no,
    i.blocking_issue_id,
    blocking.issue_title AS blocking_issue_title,
    blocking.issue_no AS blocking_issue_no,
    p.project_id,
    p.project_name,
    p.slug AS project_slug,
    s.site_id,
    s.site_name,
    o.org_id,
    o.org_name,
    ( SELECT count(*) AS count
           FROM public.issue_memberships im
          WHERE ((im.issue_id = i.issue_id) AND (im.membership_is_active = true) AND (im.deleted_at IS NULL))) AS member_count,
    ( SELECT count(*) AS count
           FROM public.issue_assets ia
          WHERE ((ia.issue_id = i.issue_id) AND (ia.is_active = true) AND (ia.deleted_at IS NULL))) AS asset_count
   FROM (((((((public.issues i
     LEFT JOIN public.users r ON (((r.user_id = i.reporter_id) AND (r.deleted_at IS NULL))))
     LEFT JOIN public.users a ON (((a.user_id = i.assignee_id) AND (a.deleted_at IS NULL))))
     LEFT JOIN public.issues parent ON (((parent.issue_id = i.parent_issue_id) AND (parent.deleted_at IS NULL))))
     LEFT JOIN public.issues blocking ON (((blocking.issue_id = i.blocking_issue_id) AND (blocking.deleted_at IS NULL))))
     JOIN public.projects p ON (((p.project_id = i.project_id) AND (p.deleted_at IS NULL))))
     JOIN public.sites s ON (((s.site_id = p.site_id) AND (s.deleted_at IS NULL))))
     JOIN public.organizations o ON (((o.org_id = s.org_id) AND (o.deleted_at IS NULL))))
  WHERE (i.deleted_at IS NULL);


ALTER VIEW public.issue_summary OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 18126)
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    attempt_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    ip_address inet,
    success boolean DEFAULT false NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17864)
-- Name: organization_assets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.organization_assets OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17637)
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.organization_memberships OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 18152)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 17563)
-- Name: platform_users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.platform_users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17891)
-- Name: project_assets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.project_assets OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17732)
-- Name: project_memberships; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.project_memberships OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17764)
-- Name: project_requirements; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.project_requirements OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 18310)
-- Name: project_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.project_summary AS
 SELECT p.project_id,
    p.project_name,
    p.project_description,
    p.slug,
    p.project_status,
    p.is_private,
    p.created_at,
    p.created_by,
    p.completed_at,
    p.completed_by,
    s.site_id,
    s.site_name,
    o.org_id,
    o.org_name,
    ( SELECT count(*) AS count
           FROM public.issues i
          WHERE ((i.project_id = p.project_id) AND (i.deleted_at IS NULL))) AS total_issues,
    ( SELECT count(*) AS count
           FROM public.issues i
          WHERE ((i.project_id = p.project_id) AND (i.status = 'open'::public.issue_status) AND (i.deleted_at IS NULL))) AS open_issues,
    ( SELECT count(*) AS count
           FROM public.project_memberships pm
          WHERE ((pm.project_id = p.project_id) AND (pm.membership_is_active = true) AND (pm.deleted_at IS NULL))) AS total_members,
    ( SELECT count(*) AS count
           FROM public.project_requirements pr
          WHERE ((pr.project_id = p.project_id) AND (pr.deleted_at IS NULL))) AS total_requirements,
    ( SELECT count(*) AS count
           FROM public.project_requirements pr
          WHERE ((pr.project_id = p.project_id) AND (pr.is_done = true) AND (pr.deleted_at IS NULL))) AS completed_requirements
   FROM ((public.projects p
     JOIN public.sites s ON (((s.site_id = p.site_id) AND (s.deleted_at IS NULL))))
     JOIN public.organizations o ON (((o.org_id = s.org_id) AND (o.deleted_at IS NULL))))
  WHERE (p.deleted_at IS NULL);


ALTER VIEW public.project_summary OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 18045)
-- Name: site_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_assets (
    site_asset_id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
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


ALTER TABLE public.site_assets OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 18033)
-- Name: site_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_memberships (
    site_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.site_role NOT NULL,
    invited_by uuid,
    membership_is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


ALTER TABLE public.site_memberships OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17581)
-- Name: system_audit_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.system_audit_logs OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 18315)
-- Name: user_permissions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_permissions AS
 SELECT user_id,
    user_name,
    user_email,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('org_id', o.org_id, 'org_name', o.org_name, 'role', om.role, 'is_active', om.membership_is_active)) AS jsonb_agg
           FROM (public.organization_memberships om
             JOIN public.organizations o ON ((o.org_id = om.org_id)))
          WHERE ((om.user_id = u.user_id) AND (om.deleted_at IS NULL) AND (o.deleted_at IS NULL))), '[]'::jsonb) AS organizations,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('site_id', s.site_id, 'site_name', s.site_name, 'org_id', s.org_id, 'role', sm.role, 'is_active', sm.membership_is_active)) AS jsonb_agg
           FROM (public.site_memberships sm
             JOIN public.sites s ON ((s.site_id = sm.site_id)))
          WHERE ((sm.user_id = u.user_id) AND (sm.deleted_at IS NULL) AND (s.deleted_at IS NULL))), '[]'::jsonb) AS sites,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('project_id', p.project_id, 'project_name', p.project_name, 'site_id', p.site_id, 'role', pm.role, 'is_active', pm.membership_is_active)) AS jsonb_agg
           FROM (public.project_memberships pm
             JOIN public.projects p ON ((p.project_id = pm.project_id)))
          WHERE ((pm.user_id = u.user_id) AND (pm.deleted_at IS NULL) AND (p.deleted_at IS NULL))), '[]'::jsonb) AS projects,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('issue_id', i.issue_id, 'issue_title', i.issue_title, 'project_id', i.project_id, 'role', im.role, 'is_active', im.membership_is_active)) AS jsonb_agg
           FROM (public.issue_memberships im
             JOIN public.issues i ON ((i.issue_id = im.issue_id)))
          WHERE ((im.user_id = u.user_id) AND (im.deleted_at IS NULL) AND (i.deleted_at IS NULL))), '[]'::jsonb) AS issues,
    ( SELECT (pu.role)::text AS role
           FROM public.platform_users pu
          WHERE ((pu.platform_user_id = u.user_id) AND (pu.is_active = true) AND (pu.deleted_at IS NULL))) AS platform_role
   FROM public.users u
  WHERE ((deleted_at IS NULL) AND (user_is_active = true));


ALTER VIEW public.user_permissions OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 18168)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token text NOT NULL,
    access_token text NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 4046 (class 0 OID 18109)
-- Dependencies: 234
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_keys (api_key_id, user_id, key_name, api_key, key_hash, last_used_at, expires_at, is_active, created_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 4043 (class 0 OID 17945)
-- Dependencies: 231
-- Data for Name: application_bugs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_bugs (bug_id, reported_by, org_id, project_id, title, description, status, priority, assigned_to, created_at, resolved_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4048 (class 0 OID 18136)
-- Dependencies: 236
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verifications (verification_id, user_id, email, token, expires_at, verified_at, created_at) FROM stdin;
\.


--
-- TOC entry 4051 (class 0 OID 18215)
-- Dependencies: 239
-- Data for Name: issue_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_activity (activity_id, issue_id, user_id, field_name, old_value, new_value, created_at) FROM stdin;
\.


--
-- TOC entry 4042 (class 0 OID 17918)
-- Dependencies: 230
-- Data for Name: issue_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_assets (issue_asset_id, issue_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4039 (class 0 OID 17840)
-- Dependencies: 227
-- Data for Name: issue_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_memberships (issue_membership_id, issue_id, user_id, role, membership_is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4038 (class 0 OID 17795)
-- Dependencies: 226
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issues (issue_id, project_id, issue_no, issue_title, issue_description, status, priority, reporter_id, assignee_id, parent_issue_id, blocking_issue_id, issue_is_active, created_at, updated_at, deleted_at, deleted_by, is_private, is_editable) FROM stdin;
\.


--
-- TOC entry 4047 (class 0 OID 18126)
-- Dependencies: 235
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (attempt_id, email, ip_address, success, attempted_at) FROM stdin;
\.


--
-- TOC entry 4040 (class 0 OID 17864)
-- Dependencies: 228
-- Data for Name: organization_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_assets (org_asset_id, org_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4033 (class 0 OID 17637)
-- Dependencies: 221
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_memberships (org_membership_id, org_id, user_id, role, invited_by, membership_is_active, joined_at, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4032 (class 0 OID 17612)
-- Dependencies: 220
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (org_id, org_check_id, org_name, org_description, slug, org_status, created_by, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4049 (class 0 OID 18152)
-- Dependencies: 237
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (token_id, user_id, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- TOC entry 4029 (class 0 OID 17563)
-- Dependencies: 217
-- Data for Name: platform_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_users (platform_user_id, email, password_hash, role, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4041 (class 0 OID 17891)
-- Dependencies: 229
-- Data for Name: project_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_assets (project_asset_id, project_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4036 (class 0 OID 17732)
-- Dependencies: 224
-- Data for Name: project_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_memberships (project_membership_id, project_id, user_id, role, invited_by, membership_is_active, joined_at, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4037 (class 0 OID 17764)
-- Dependencies: 225
-- Data for Name: project_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_requirements (requirement_id, project_id, title, description, priority, is_done, created_by, created_at, done_by, done_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4035 (class 0 OID 17697)
-- Dependencies: 223
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (project_id, site_id, project_check_id, project_name, project_description, slug, project_status, created_by, completed_at, completed_by, created_at, updated_at, deleted_at, deleted_by, is_private) FROM stdin;
\.


--
-- TOC entry 4045 (class 0 OID 18045)
-- Dependencies: 233
-- Data for Name: site_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_assets (site_asset_id, site_id, uploaded_by, asset_type, file_name, mime_type, byte_size, storage_key, checksum, metadata, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4044 (class 0 OID 18033)
-- Dependencies: 232
-- Data for Name: site_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_memberships (site_membership_id, site_id, user_id, role, invited_by, membership_is_active, joined_at, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 4034 (class 0 OID 17669)
-- Dependencies: 222
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (site_id, org_id, site_name, site_slug, site_status, created_by, created_at, updated_at, deleted_at, deleted_by, is_private) FROM stdin;
\.


--
-- TOC entry 4030 (class 0 OID 17581)
-- Dependencies: 218
-- Data for Name: system_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_audit_logs (audit_id, actor_type, actor_id, entity_type, entity_id, action_type, old_value, new_value, created_at) FROM stdin;
\.


--
-- TOC entry 4050 (class 0 OID 18168)
-- Dependencies: 238
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, user_id, refresh_token, access_token, user_agent, ip_address, expires_at, created_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 4031 (class 0 OID 17590)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, user_name, user_last_name, user_display_name, user_email, user_password, user_is_active, last_login_at, user_friendship_code, metadata, created_at, updated_at, deleted_at, deleted_by, email_verified_at, email_verification_token, password_reset_token, password_reset_expires_at, two_factor_secret, two_factor_enabled, last_password_change_at) FROM stdin;
\.


--
-- TOC entry 3787 (class 2606 OID 18120)
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- TOC entry 3789 (class 2606 OID 18118)
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (api_key_id);


--
-- TOC entry 3769 (class 2606 OID 17955)
-- Name: application_bugs application_bugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_pkey PRIMARY KEY (bug_id);


--
-- TOC entry 3793 (class 2606 OID 18144)
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (verification_id);


--
-- TOC entry 3795 (class 2606 OID 18146)
-- Name: email_verifications email_verifications_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_token_key UNIQUE (token);


--
-- TOC entry 3805 (class 2606 OID 18223)
-- Name: issue_activity issue_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_pkey PRIMARY KEY (activity_id);


--
-- TOC entry 3767 (class 2606 OID 17929)
-- Name: issue_assets issue_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_pkey PRIMARY KEY (issue_asset_id);


--
-- TOC entry 3761 (class 2606 OID 17848)
-- Name: issue_memberships issue_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_pkey PRIMARY KEY (issue_membership_id);


--
-- TOC entry 3750 (class 2606 OID 17807)
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (issue_id);


--
-- TOC entry 3752 (class 2606 OID 17809)
-- Name: issues issues_project_id_issue_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_issue_no_key UNIQUE (project_id, issue_no);


--
-- TOC entry 3791 (class 2606 OID 18135)
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (attempt_id);


--
-- TOC entry 3763 (class 2606 OID 17875)
-- Name: organization_assets organization_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_pkey PRIMARY KEY (org_asset_id);


--
-- TOC entry 3710 (class 2606 OID 17648)
-- Name: organization_memberships organization_memberships_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- TOC entry 3712 (class 2606 OID 17646)
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (org_membership_id);


--
-- TOC entry 3694 (class 2606 OID 17624)
-- Name: organizations organizations_org_check_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_org_check_id_key UNIQUE (org_check_id);


--
-- TOC entry 3696 (class 2606 OID 17622)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (org_id);


--
-- TOC entry 3698 (class 2606 OID 17626)
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- TOC entry 3797 (class 2606 OID 18160)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 3799 (class 2606 OID 18162)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 3677 (class 2606 OID 17575)
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- TOC entry 3679 (class 2606 OID 17573)
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (platform_user_id);


--
-- TOC entry 3765 (class 2606 OID 17902)
-- Name: project_assets project_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_pkey PRIMARY KEY (project_asset_id);


--
-- TOC entry 3733 (class 2606 OID 17741)
-- Name: project_memberships project_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_pkey PRIMARY KEY (project_membership_id);


--
-- TOC entry 3735 (class 2606 OID 17743)
-- Name: project_memberships project_memberships_project_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_user_id_key UNIQUE (project_id, user_id);


--
-- TOC entry 3737 (class 2606 OID 17774)
-- Name: project_requirements project_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_pkey PRIMARY KEY (requirement_id);


--
-- TOC entry 3718 (class 2606 OID 17707)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- TOC entry 3720 (class 2606 OID 17709)
-- Name: projects projects_project_check_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_check_id_key UNIQUE (project_check_id);


--
-- TOC entry 3722 (class 2606 OID 17711)
-- Name: projects projects_site_id_project_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_project_name_key UNIQUE (site_id, project_name);


--
-- TOC entry 3785 (class 2606 OID 18056)
-- Name: site_assets site_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_pkey PRIMARY KEY (site_asset_id);


--
-- TOC entry 3781 (class 2606 OID 18042)
-- Name: site_memberships site_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_pkey PRIMARY KEY (site_membership_id);


--
-- TOC entry 3783 (class 2606 OID 18044)
-- Name: site_memberships site_memberships_site_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_site_id_user_id_key UNIQUE (site_id, user_id);


--
-- TOC entry 3714 (class 2606 OID 17681)
-- Name: sites sites_org_id_site_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_site_slug_key UNIQUE (org_id, site_slug);


--
-- TOC entry 3716 (class 2606 OID 17679)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (site_id);


--
-- TOC entry 3681 (class 2606 OID 17589)
-- Name: system_audit_logs system_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 3801 (class 2606 OID 18176)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 3803 (class 2606 OID 18178)
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 3688 (class 2606 OID 17602)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3690 (class 2606 OID 17604)
-- Name: users users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_email_key UNIQUE (user_email);


--
-- TOC entry 3692 (class 2606 OID 17606)
-- Name: users users_user_friendship_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_friendship_code_key UNIQUE (user_friendship_code);


--
-- TOC entry 3753 (class 1259 OID 18240)
-- Name: idx_issue_memberships_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_is_active ON public.issue_memberships USING btree (membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3754 (class 1259 OID 18238)
-- Name: idx_issue_memberships_issue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_issue_id ON public.issue_memberships USING btree (issue_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3755 (class 1259 OID 18242)
-- Name: idx_issue_memberships_issue_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_issue_role ON public.issue_memberships USING btree (issue_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3756 (class 1259 OID 18239)
-- Name: idx_issue_memberships_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_role ON public.issue_memberships USING btree (role) WHERE (deleted_at IS NULL);


--
-- TOC entry 3757 (class 1259 OID 18237)
-- Name: idx_issue_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_user_id ON public.issue_memberships USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3758 (class 1259 OID 18241)
-- Name: idx_issue_memberships_user_issue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_user_issue ON public.issue_memberships USING btree (user_id, issue_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3759 (class 1259 OID 18243)
-- Name: idx_issue_memberships_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issue_memberships_user_role ON public.issue_memberships USING btree (user_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3738 (class 1259 OID 18234)
-- Name: idx_issues_assignee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_assignee_id ON public.issues USING btree (assignee_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3739 (class 1259 OID 18236)
-- Name: idx_issues_assignee_id_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_assignee_id_priority ON public.issues USING btree (assignee_id, priority) WHERE (deleted_at IS NULL);


--
-- TOC entry 3740 (class 1259 OID 18235)
-- Name: idx_issues_assignee_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_assignee_id_status ON public.issues USING btree (assignee_id, status) WHERE (deleted_at IS NULL);


--
-- TOC entry 3741 (class 1259 OID 18249)
-- Name: idx_issues_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_created_at ON public.issues USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- TOC entry 3742 (class 1259 OID 18248)
-- Name: idx_issues_parent_issue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_parent_issue_id ON public.issues USING btree (parent_issue_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3743 (class 1259 OID 18246)
-- Name: idx_issues_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_priority ON public.issues USING btree (priority) WHERE (deleted_at IS NULL);


--
-- TOC entry 3744 (class 1259 OID 18244)
-- Name: idx_issues_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_project_id ON public.issues USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3745 (class 1259 OID 18251)
-- Name: idx_issues_project_id_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_project_id_priority ON public.issues USING btree (project_id, priority) WHERE (deleted_at IS NULL);


--
-- TOC entry 3746 (class 1259 OID 18250)
-- Name: idx_issues_project_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_project_id_status ON public.issues USING btree (project_id, status) WHERE (deleted_at IS NULL);


--
-- TOC entry 3747 (class 1259 OID 18247)
-- Name: idx_issues_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_reporter_id ON public.issues USING btree (reporter_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3748 (class 1259 OID 18245)
-- Name: idx_issues_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issues_status ON public.issues USING btree (status) WHERE (deleted_at IS NULL);


--
-- TOC entry 3699 (class 1259 OID 18256)
-- Name: idx_organization_memberships_invited_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_invited_by ON public.organization_memberships USING btree (invited_by) WHERE (deleted_at IS NULL);


--
-- TOC entry 3700 (class 1259 OID 18255)
-- Name: idx_organization_memberships_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_is_active ON public.organization_memberships USING btree (membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3701 (class 1259 OID 18257)
-- Name: idx_organization_memberships_joined_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_joined_at ON public.organization_memberships USING btree (joined_at DESC) WHERE (deleted_at IS NULL);


--
-- TOC entry 3702 (class 1259 OID 18261)
-- Name: idx_organization_memberships_org_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_org_active ON public.organization_memberships USING btree (org_id, membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3703 (class 1259 OID 18253)
-- Name: idx_organization_memberships_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_org_id ON public.organization_memberships USING btree (org_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3704 (class 1259 OID 18259)
-- Name: idx_organization_memberships_org_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_org_role ON public.organization_memberships USING btree (org_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3705 (class 1259 OID 18254)
-- Name: idx_organization_memberships_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_role ON public.organization_memberships USING btree (role) WHERE (deleted_at IS NULL);


--
-- TOC entry 3706 (class 1259 OID 18252)
-- Name: idx_organization_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_user_id ON public.organization_memberships USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3707 (class 1259 OID 18258)
-- Name: idx_organization_memberships_user_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_user_org ON public.organization_memberships USING btree (user_id, org_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3708 (class 1259 OID 18260)
-- Name: idx_organization_memberships_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_memberships_user_role ON public.organization_memberships USING btree (user_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3723 (class 1259 OID 18266)
-- Name: idx_project_memberships_invited_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_invited_by ON public.project_memberships USING btree (invited_by) WHERE (deleted_at IS NULL);


--
-- TOC entry 3724 (class 1259 OID 18265)
-- Name: idx_project_memberships_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_is_active ON public.project_memberships USING btree (membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3725 (class 1259 OID 18270)
-- Name: idx_project_memberships_project_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_project_active ON public.project_memberships USING btree (project_id, membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3726 (class 1259 OID 18263)
-- Name: idx_project_memberships_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_project_id ON public.project_memberships USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3727 (class 1259 OID 18268)
-- Name: idx_project_memberships_project_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_project_role ON public.project_memberships USING btree (project_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3728 (class 1259 OID 18264)
-- Name: idx_project_memberships_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_role ON public.project_memberships USING btree (role) WHERE (deleted_at IS NULL);


--
-- TOC entry 3729 (class 1259 OID 18262)
-- Name: idx_project_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_user_id ON public.project_memberships USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3730 (class 1259 OID 18267)
-- Name: idx_project_memberships_user_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_user_project ON public.project_memberships USING btree (user_id, project_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3731 (class 1259 OID 18269)
-- Name: idx_project_memberships_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_memberships_user_role ON public.project_memberships USING btree (user_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3770 (class 1259 OID 18275)
-- Name: idx_site_memberships_invited_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_invited_by ON public.site_memberships USING btree (invited_by) WHERE (deleted_at IS NULL);


--
-- TOC entry 3771 (class 1259 OID 18274)
-- Name: idx_site_memberships_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_is_active ON public.site_memberships USING btree (membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3772 (class 1259 OID 18276)
-- Name: idx_site_memberships_joined_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_joined_at ON public.site_memberships USING btree (joined_at DESC) WHERE (deleted_at IS NULL);


--
-- TOC entry 3773 (class 1259 OID 18273)
-- Name: idx_site_memberships_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_role ON public.site_memberships USING btree (role) WHERE (deleted_at IS NULL);


--
-- TOC entry 3774 (class 1259 OID 18280)
-- Name: idx_site_memberships_site_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_site_active ON public.site_memberships USING btree (site_id, membership_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3775 (class 1259 OID 18272)
-- Name: idx_site_memberships_site_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_site_id ON public.site_memberships USING btree (site_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3776 (class 1259 OID 18278)
-- Name: idx_site_memberships_site_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_site_role ON public.site_memberships USING btree (site_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3777 (class 1259 OID 18271)
-- Name: idx_site_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_user_id ON public.site_memberships USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3778 (class 1259 OID 18279)
-- Name: idx_site_memberships_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_user_role ON public.site_memberships USING btree (user_id, role) WHERE ((membership_is_active = true) AND (deleted_at IS NULL));


--
-- TOC entry 3779 (class 1259 OID 18277)
-- Name: idx_site_memberships_user_site; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_memberships_user_site ON public.site_memberships USING btree (user_id, site_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3682 (class 1259 OID 18285)
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (user_is_active) WHERE (deleted_at IS NULL);


--
-- TOC entry 3683 (class 1259 OID 18284)
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- TOC entry 3684 (class 1259 OID 18281)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (user_email) WHERE ((deleted_at IS NULL) AND (user_is_active = true));


--
-- TOC entry 3685 (class 1259 OID 18282)
-- Name: idx_users_friendship_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_friendship_code ON public.users USING btree (user_friendship_code) WHERE ((deleted_at IS NULL) AND (user_is_active = true));


--
-- TOC entry 3686 (class 1259 OID 18283)
-- Name: idx_users_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_name ON public.users USING btree (user_name) WHERE (deleted_at IS NULL);


--
-- TOC entry 3870 (class 2620 OID 18287)
-- Name: issues issue_activity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER issue_activity_trigger AFTER INSERT OR DELETE OR UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.trg_issue_activity();


--
-- TOC entry 3875 (class 2620 OID 18296)
-- Name: issue_assets issue_assets_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER issue_assets_update_trigger BEFORE UPDATE ON public.issue_assets FOR EACH ROW EXECUTE FUNCTION public.trg_assets_update();


--
-- TOC entry 3872 (class 2620 OID 18290)
-- Name: issue_memberships issue_memberships_role_guard_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER issue_memberships_role_guard_trigger BEFORE INSERT OR UPDATE OF role ON public.issue_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_issue_memberships_role_guard();


--
-- TOC entry 3873 (class 2620 OID 18293)
-- Name: organization_assets organization_assets_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER organization_assets_update_trigger BEFORE UPDATE ON public.organization_assets FOR EACH ROW EXECUTE FUNCTION public.trg_assets_update();


--
-- TOC entry 3871 (class 2620 OID 18304)
-- Name: issues prevent_issue_delete_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_issue_delete_trigger BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_issue_delete_if_has_children();


--
-- TOC entry 3865 (class 2620 OID 18302)
-- Name: organizations prevent_org_delete_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_org_delete_trigger BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_org_delete_if_has_sites();


--
-- TOC entry 3867 (class 2620 OID 18300)
-- Name: projects prevent_project_delete_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_project_delete_trigger BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_project_delete_if_has_issues();


--
-- TOC entry 3866 (class 2620 OID 18298)
-- Name: sites prevent_site_delete_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_site_delete_trigger BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_site_delete_if_has_projects();


--
-- TOC entry 3874 (class 2620 OID 18295)
-- Name: project_assets project_assets_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER project_assets_update_trigger BEFORE UPDATE ON public.project_assets FOR EACH ROW EXECUTE FUNCTION public.trg_assets_update();


--
-- TOC entry 3868 (class 2620 OID 17990)
-- Name: project_memberships project_memberships_role_guard; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER project_memberships_role_guard BEFORE INSERT OR UPDATE OF role ON public.project_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_project_memberships_role_guard();


--
-- TOC entry 3869 (class 2620 OID 18291)
-- Name: project_memberships project_memberships_role_guard_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER project_memberships_role_guard_trigger BEFORE INSERT OR UPDATE OF role ON public.project_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_project_memberships_role_guard();


--
-- TOC entry 3877 (class 2620 OID 18294)
-- Name: site_assets site_assets_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER site_assets_update_trigger BEFORE UPDATE ON public.site_assets FOR EACH ROW EXECUTE FUNCTION public.trg_assets_update();


--
-- TOC entry 3876 (class 2620 OID 18098)
-- Name: site_memberships site_memberships_role_guard; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER site_memberships_role_guard BEFORE INSERT OR UPDATE OF role ON public.site_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_site_memberships_role_guard();


--
-- TOC entry 3859 (class 2606 OID 18121)
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3847 (class 2606 OID 17971)
-- Name: application_bugs application_bugs_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3848 (class 2606 OID 17976)
-- Name: application_bugs application_bugs_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3849 (class 2606 OID 17961)
-- Name: application_bugs application_bugs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE SET NULL;


--
-- TOC entry 3850 (class 2606 OID 17966)
-- Name: application_bugs application_bugs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE SET NULL;


--
-- TOC entry 3851 (class 2606 OID 17956)
-- Name: application_bugs application_bugs_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id);


--
-- TOC entry 3860 (class 2606 OID 18147)
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3863 (class 2606 OID 18224)
-- Name: issue_activity issue_activity_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3864 (class 2606 OID 18229)
-- Name: issue_activity issue_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3844 (class 2606 OID 17940)
-- Name: issue_assets issue_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3845 (class 2606 OID 17930)
-- Name: issue_assets issue_assets_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3846 (class 2606 OID 17935)
-- Name: issue_assets issue_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3835 (class 2606 OID 17859)
-- Name: issue_memberships issue_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3836 (class 2606 OID 17849)
-- Name: issue_memberships issue_memberships_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3837 (class 2606 OID 17854)
-- Name: issue_memberships issue_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3829 (class 2606 OID 17820)
-- Name: issues issues_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3830 (class 2606 OID 17830)
-- Name: issues issues_blocking_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_blocking_issue_id_fkey FOREIGN KEY (blocking_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3831 (class 2606 OID 17835)
-- Name: issues issues_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3832 (class 2606 OID 17825)
-- Name: issues issues_parent_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_parent_issue_id_fkey FOREIGN KEY (parent_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3833 (class 2606 OID 17810)
-- Name: issues issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3834 (class 2606 OID 17815)
-- Name: issues issues_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3838 (class 2606 OID 17886)
-- Name: organization_assets organization_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3839 (class 2606 OID 17876)
-- Name: organization_assets organization_assets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3840 (class 2606 OID 17881)
-- Name: organization_assets organization_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3810 (class 2606 OID 17664)
-- Name: organization_memberships organization_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3811 (class 2606 OID 17659)
-- Name: organization_memberships organization_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3812 (class 2606 OID 17649)
-- Name: organization_memberships organization_memberships_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3813 (class 2606 OID 17654)
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3808 (class 2606 OID 17627)
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3809 (class 2606 OID 17632)
-- Name: organizations organizations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3861 (class 2606 OID 18163)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3806 (class 2606 OID 17576)
-- Name: platform_users platform_users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3841 (class 2606 OID 17913)
-- Name: project_assets project_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3842 (class 2606 OID 17903)
-- Name: project_assets project_assets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3843 (class 2606 OID 17908)
-- Name: project_assets project_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3821 (class 2606 OID 17759)
-- Name: project_memberships project_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3822 (class 2606 OID 17754)
-- Name: project_memberships project_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3823 (class 2606 OID 17744)
-- Name: project_memberships project_memberships_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3824 (class 2606 OID 17749)
-- Name: project_memberships project_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3825 (class 2606 OID 17780)
-- Name: project_requirements project_requirements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3826 (class 2606 OID 17790)
-- Name: project_requirements project_requirements_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3827 (class 2606 OID 17785)
-- Name: project_requirements project_requirements_done_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_done_by_fkey FOREIGN KEY (done_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3828 (class 2606 OID 17775)
-- Name: project_requirements project_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3817 (class 2606 OID 17722)
-- Name: projects projects_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3818 (class 2606 OID 17717)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3819 (class 2606 OID 17727)
-- Name: projects projects_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3820 (class 2606 OID 17712)
-- Name: projects projects_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3856 (class 2606 OID 18087)
-- Name: site_assets site_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3857 (class 2606 OID 18077)
-- Name: site_assets site_assets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3858 (class 2606 OID 18082)
-- Name: site_assets site_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3852 (class 2606 OID 18072)
-- Name: site_memberships site_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3853 (class 2606 OID 18067)
-- Name: site_memberships site_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3854 (class 2606 OID 18057)
-- Name: site_memberships site_memberships_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3855 (class 2606 OID 18062)
-- Name: site_memberships site_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3814 (class 2606 OID 17687)
-- Name: sites sites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3815 (class 2606 OID 17692)
-- Name: sites sites_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3816 (class 2606 OID 17682)
-- Name: sites sites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3862 (class 2606 OID 18179)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3807 (class 2606 OID 17607)
-- Name: users users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4024 (class 0 OID 17612)
-- Dependencies: 220
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4027 (class 3256 OID 18017)
-- Name: organizations organizations_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_delete_policy ON public.organizations FOR DELETE USING (public.auth_is_org_owner(org_id));


--
-- TOC entry 4028 (class 3256 OID 18018)
-- Name: organizations organizations_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_insert_policy ON public.organizations FOR INSERT WITH CHECK ((created_by = public.auth_current_user_id()));


--
-- TOC entry 4025 (class 3256 OID 18015)
-- Name: organizations organizations_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_select_policy ON public.organizations FOR SELECT USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id) OR public.auth_is_org_member(org_id) OR public.auth_is_org_viewer(org_id)));


--
-- TOC entry 4026 (class 3256 OID 18016)
-- Name: organizations organizations_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_update_policy ON public.organizations FOR UPDATE USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id))) WITH CHECK ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id)));


-- Completed on 2026-04-13 20:30:56 +03

--
-- PostgreSQL database dump complete
--

\unrestrict 4oiUHodjGMlb0LgFlrYYsCEztKaPNv4ehWfo4Xf6y6pXVy9JwoH6T5GFnTeUl5F

