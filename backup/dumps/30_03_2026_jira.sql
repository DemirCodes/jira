--
-- PostgreSQL database dump
--

\restrict QhOinnCzJQSyMx7MsEaMGB9WmUf1mcUzjJ9XVfGR5uSdToYBoweJbpPKOzy81ET

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

-- Started on 2026-03-30 13:36:55 +03

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
-- TOC entry 985 (class 1247 OID 17484)
-- Name: actor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.actor_type AS ENUM (
    'tenant_user',
    'platform_user'
);


--
-- TOC entry 1006 (class 1247 OID 17550)
-- Name: asset_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.asset_type AS ENUM (
    'file',
    'image'
);


--
-- TOC entry 976 (class 1247 OID 17364)
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'U',
    'I',
    'D'
);


--
-- TOC entry 982 (class 1247 OID 17472)
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
-- TOC entry 973 (class 1247 OID 17352)
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
-- TOC entry 994 (class 1247 OID 17510)
-- Name: issue_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_role AS ENUM (
    'contributor',
    'reviewer',
    'watcher'
);


--
-- TOC entry 1000 (class 1247 OID 17526)
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
-- TOC entry 970 (class 1247 OID 17343)
-- Name: issue_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_type AS ENUM (
    'task',
    'bug',
    'story',
    'epic'
);


--
-- TOC entry 988 (class 1247 OID 17490)
-- Name: org_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


--
-- TOC entry 1066 (class 1247 OID 18100)
-- Name: org_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_status AS ENUM (
    'active',
    'completed',
    'archived'
);


--
-- TOC entry 979 (class 1247 OID 17464)
-- Name: platform_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'support_admin',
    'billing_admin'
);


--
-- TOC entry 1003 (class 1247 OID 17540)
-- Name: priority_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- TOC entry 991 (class 1247 OID 17500)
-- Name: project_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_role AS ENUM (
    'project_admin',
    'contributor',
    'reviewer',
    'viewer'
);


--
-- TOC entry 997 (class 1247 OID 17518)
-- Name: project_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_status AS ENUM (
    'active',
    'completed',
    'archived'
);


--
-- TOC entry 1057 (class 1247 OID 18026)
-- Name: site_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.site_role AS ENUM (
    'admin',
    'contrubitor',
    'viewer'
);


--
-- TOC entry 1009 (class 1247 OID 17556)
-- Name: site_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.site_status AS ENUM (
    'active',
    'archived',
    'suspended'
);


--
-- TOC entry 268 (class 1255 OID 17999)
-- Name: auth_current_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_current_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
select current_setting('app.current_user_id')::uuid;
$$;


--
-- TOC entry 332 (class 1255 OID 18008)
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
-- TOC entry 244 (class 1255 OID 18009)
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
-- TOC entry 295 (class 1255 OID 18010)
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
-- TOC entry 242 (class 1255 OID 18002)
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
-- TOC entry 346 (class 1255 OID 18000)
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
-- TOC entry 240 (class 1255 OID 18003)
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
-- TOC entry 250 (class 1255 OID 18001)
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
-- TOC entry 270 (class 1255 OID 18004)
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
-- TOC entry 279 (class 1255 OID 18005)
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
-- TOC entry 302 (class 1255 OID 18006)
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
-- TOC entry 339 (class 1255 OID 18007)
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
-- TOC entry 319 (class 1255 OID 18092)
-- Name: auth_is_site_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 340 (class 1255 OID 18095)
-- Name: auth_is_site_contrubitor(uuid); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 313 (class 1255 OID 18094)
-- Name: auth_is_site_viewer(uuid); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 241 (class 1255 OID 17988)
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
-- TOC entry 281 (class 1255 OID 18022)
-- Name: create_organization(text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 247 (class 1255 OID 17982)
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
-- TOC entry 261 (class 1255 OID 18024)
-- Name: get_organizations(uuid); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 344 (class 1255 OID 18023)
-- Name: list_user_organizations(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 343 (class 1255 OID 17989)
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
-- TOC entry 322 (class 1255 OID 18097)
-- Name: trg_site_memberships_role_guard(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- TOC entry 267 (class 1255 OID 18021)
-- Name: update_orgzanization(uuid, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
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


SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 18109)
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
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
-- TOC entry 236 (class 1259 OID 18136)
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: -
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
-- TOC entry 235 (class 1259 OID 18126)
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    attempt_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    ip_address inet,
    success boolean DEFAULT false NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
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
-- TOC entry 237 (class 1259 OID 18152)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
-- TOC entry 233 (class 1259 OID 18045)
-- Name: site_assets; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 232 (class 1259 OID 18033)
-- Name: site_memberships; Type: TABLE; Schema: public; Owner: -
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
-- TOC entry 238 (class 1259 OID 18168)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
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
    deleted_by uuid,
    email_verified_at timestamp with time zone,
    email_verification_token text,
    password_reset_token text,
    password_reset_expires_at timestamp with time zone,
    two_factor_secret text,
    two_factor_enabled boolean DEFAULT false,
    last_password_change_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 3687 (class 2606 OID 18120)
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- TOC entry 3689 (class 2606 OID 18118)
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (api_key_id);


--
-- TOC entry 3679 (class 2606 OID 17955)
-- Name: application_bugs application_bugs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_pkey PRIMARY KEY (bug_id);


--
-- TOC entry 3693 (class 2606 OID 18144)
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (verification_id);


--
-- TOC entry 3695 (class 2606 OID 18146)
-- Name: email_verifications email_verifications_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_token_key UNIQUE (token);


--
-- TOC entry 3677 (class 2606 OID 17929)
-- Name: issue_assets issue_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_pkey PRIMARY KEY (issue_asset_id);


--
-- TOC entry 3671 (class 2606 OID 17848)
-- Name: issue_memberships issue_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_pkey PRIMARY KEY (issue_membership_id);


--
-- TOC entry 3667 (class 2606 OID 17807)
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (issue_id);


--
-- TOC entry 3669 (class 2606 OID 17809)
-- Name: issues issues_project_id_issue_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_issue_no_key UNIQUE (project_id, issue_no);


--
-- TOC entry 3691 (class 2606 OID 18135)
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (attempt_id);


--
-- TOC entry 3673 (class 2606 OID 17875)
-- Name: organization_assets organization_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_pkey PRIMARY KEY (org_asset_id);


--
-- TOC entry 3647 (class 2606 OID 17648)
-- Name: organization_memberships organization_memberships_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- TOC entry 3649 (class 2606 OID 17646)
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (org_membership_id);


--
-- TOC entry 3641 (class 2606 OID 17624)
-- Name: organizations organizations_org_check_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_org_check_id_key UNIQUE (org_check_id);


--
-- TOC entry 3643 (class 2606 OID 17622)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (org_id);


--
-- TOC entry 3645 (class 2606 OID 17626)
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- TOC entry 3697 (class 2606 OID 18160)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 3699 (class 2606 OID 18162)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 3629 (class 2606 OID 17575)
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- TOC entry 3631 (class 2606 OID 17573)
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (platform_user_id);


--
-- TOC entry 3675 (class 2606 OID 17902)
-- Name: project_assets project_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_pkey PRIMARY KEY (project_asset_id);


--
-- TOC entry 3661 (class 2606 OID 17741)
-- Name: project_memberships project_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_pkey PRIMARY KEY (project_membership_id);


--
-- TOC entry 3663 (class 2606 OID 17743)
-- Name: project_memberships project_memberships_project_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_user_id_key UNIQUE (project_id, user_id);


--
-- TOC entry 3665 (class 2606 OID 17774)
-- Name: project_requirements project_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_pkey PRIMARY KEY (requirement_id);


--
-- TOC entry 3655 (class 2606 OID 17707)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- TOC entry 3657 (class 2606 OID 17709)
-- Name: projects projects_project_check_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_check_id_key UNIQUE (project_check_id);


--
-- TOC entry 3659 (class 2606 OID 17711)
-- Name: projects projects_site_id_project_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_project_name_key UNIQUE (site_id, project_name);


--
-- TOC entry 3685 (class 2606 OID 18056)
-- Name: site_assets site_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_pkey PRIMARY KEY (site_asset_id);


--
-- TOC entry 3681 (class 2606 OID 18042)
-- Name: site_memberships site_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_pkey PRIMARY KEY (site_membership_id);


--
-- TOC entry 3683 (class 2606 OID 18044)
-- Name: site_memberships site_memberships_site_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_site_id_user_id_key UNIQUE (site_id, user_id);


--
-- TOC entry 3651 (class 2606 OID 17681)
-- Name: sites sites_org_id_site_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_site_slug_key UNIQUE (org_id, site_slug);


--
-- TOC entry 3653 (class 2606 OID 17679)
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (site_id);


--
-- TOC entry 3633 (class 2606 OID 17589)
-- Name: system_audit_logs system_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 3701 (class 2606 OID 18176)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 3703 (class 2606 OID 18178)
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 3635 (class 2606 OID 17602)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3637 (class 2606 OID 17604)
-- Name: users users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_email_key UNIQUE (user_email);


--
-- TOC entry 3639 (class 2606 OID 17606)
-- Name: users users_user_friendship_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_friendship_code_key UNIQUE (user_friendship_code);


--
-- TOC entry 3761 (class 2620 OID 17990)
-- Name: project_memberships project_memberships_role_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_memberships_role_guard BEFORE INSERT OR UPDATE OF role ON public.project_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_project_memberships_role_guard();


--
-- TOC entry 3762 (class 2620 OID 18098)
-- Name: site_memberships site_memberships_role_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER site_memberships_role_guard BEFORE INSERT OR UPDATE OF role ON public.site_memberships FOR EACH ROW EXECUTE FUNCTION public.trg_site_memberships_role_guard();


--
-- TOC entry 3757 (class 2606 OID 18121)
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3745 (class 2606 OID 17971)
-- Name: application_bugs application_bugs_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3746 (class 2606 OID 17976)
-- Name: application_bugs application_bugs_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3747 (class 2606 OID 17961)
-- Name: application_bugs application_bugs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE SET NULL;


--
-- TOC entry 3748 (class 2606 OID 17966)
-- Name: application_bugs application_bugs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE SET NULL;


--
-- TOC entry 3749 (class 2606 OID 17956)
-- Name: application_bugs application_bugs_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_bugs
    ADD CONSTRAINT application_bugs_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id);


--
-- TOC entry 3758 (class 2606 OID 18147)
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3742 (class 2606 OID 17940)
-- Name: issue_assets issue_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3743 (class 2606 OID 17930)
-- Name: issue_assets issue_assets_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3744 (class 2606 OID 17935)
-- Name: issue_assets issue_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_assets
    ADD CONSTRAINT issue_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3733 (class 2606 OID 17859)
-- Name: issue_memberships issue_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3734 (class 2606 OID 17849)
-- Name: issue_memberships issue_memberships_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(issue_id) ON DELETE CASCADE;


--
-- TOC entry 3735 (class 2606 OID 17854)
-- Name: issue_memberships issue_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_memberships
    ADD CONSTRAINT issue_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3727 (class 2606 OID 17820)
-- Name: issues issues_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3728 (class 2606 OID 17830)
-- Name: issues issues_blocking_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_blocking_issue_id_fkey FOREIGN KEY (blocking_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3729 (class 2606 OID 17835)
-- Name: issues issues_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3730 (class 2606 OID 17825)
-- Name: issues issues_parent_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_parent_issue_id_fkey FOREIGN KEY (parent_issue_id) REFERENCES public.issues(issue_id) ON DELETE SET NULL;


--
-- TOC entry 3731 (class 2606 OID 17810)
-- Name: issues issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3732 (class 2606 OID 17815)
-- Name: issues issues_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3736 (class 2606 OID 17886)
-- Name: organization_assets organization_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3737 (class 2606 OID 17876)
-- Name: organization_assets organization_assets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3738 (class 2606 OID 17881)
-- Name: organization_assets organization_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_assets
    ADD CONSTRAINT organization_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3708 (class 2606 OID 17664)
-- Name: organization_memberships organization_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3709 (class 2606 OID 17659)
-- Name: organization_memberships organization_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3710 (class 2606 OID 17649)
-- Name: organization_memberships organization_memberships_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3711 (class 2606 OID 17654)
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3706 (class 2606 OID 17627)
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3707 (class 2606 OID 17632)
-- Name: organizations organizations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3759 (class 2606 OID 18163)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3704 (class 2606 OID 17576)
-- Name: platform_users platform_users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.platform_users(platform_user_id) ON DELETE SET NULL;


--
-- TOC entry 3739 (class 2606 OID 17913)
-- Name: project_assets project_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3740 (class 2606 OID 17903)
-- Name: project_assets project_assets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3741 (class 2606 OID 17908)
-- Name: project_assets project_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_assets
    ADD CONSTRAINT project_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3719 (class 2606 OID 17759)
-- Name: project_memberships project_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3720 (class 2606 OID 17754)
-- Name: project_memberships project_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3721 (class 2606 OID 17744)
-- Name: project_memberships project_memberships_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3722 (class 2606 OID 17749)
-- Name: project_memberships project_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_memberships
    ADD CONSTRAINT project_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3723 (class 2606 OID 17780)
-- Name: project_requirements project_requirements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3724 (class 2606 OID 17790)
-- Name: project_requirements project_requirements_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3725 (class 2606 OID 17785)
-- Name: project_requirements project_requirements_done_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_done_by_fkey FOREIGN KEY (done_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3726 (class 2606 OID 17775)
-- Name: project_requirements project_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_requirements
    ADD CONSTRAINT project_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- TOC entry 3715 (class 2606 OID 17722)
-- Name: projects projects_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3716 (class 2606 OID 17717)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3717 (class 2606 OID 17727)
-- Name: projects projects_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3718 (class 2606 OID 17712)
-- Name: projects projects_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3754 (class 2606 OID 18087)
-- Name: site_assets site_assets_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3755 (class 2606 OID 18077)
-- Name: site_assets site_assets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3756 (class 2606 OID 18082)
-- Name: site_assets site_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_assets
    ADD CONSTRAINT site_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3750 (class 2606 OID 18072)
-- Name: site_memberships site_memberships_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3751 (class 2606 OID 18067)
-- Name: site_memberships site_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3752 (class 2606 OID 18057)
-- Name: site_memberships site_memberships_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;


--
-- TOC entry 3753 (class 2606 OID 18062)
-- Name: site_memberships site_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_memberships
    ADD CONSTRAINT site_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3712 (class 2606 OID 17687)
-- Name: sites sites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3713 (class 2606 OID 17692)
-- Name: sites sites_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3714 (class 2606 OID 17682)
-- Name: sites sites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;


--
-- TOC entry 3760 (class 2606 OID 18179)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3705 (class 2606 OID 17607)
-- Name: users users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3906 (class 0 OID 17612)
-- Dependencies: 220
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3909 (class 3256 OID 18017)
-- Name: organizations organizations_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_delete_policy ON public.organizations FOR DELETE USING (public.auth_is_org_owner(org_id));


--
-- TOC entry 3910 (class 3256 OID 18018)
-- Name: organizations organizations_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_insert_policy ON public.organizations FOR INSERT WITH CHECK ((created_by = public.auth_current_user_id()));


--
-- TOC entry 3907 (class 3256 OID 18015)
-- Name: organizations organizations_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_select_policy ON public.organizations FOR SELECT USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id) OR public.auth_is_org_member(org_id) OR public.auth_is_org_viewer(org_id)));


--
-- TOC entry 3908 (class 3256 OID 18016)
-- Name: organizations organizations_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_update_policy ON public.organizations FOR UPDATE USING ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id))) WITH CHECK ((public.auth_is_org_owner(org_id) OR public.auth_is_org_admin(org_id)));


-- Completed on 2026-03-30 13:36:55 +03

--
-- PostgreSQL database dump complete
--

\unrestrict QhOinnCzJQSyMx7MsEaMGB9WmUf1mcUzjJ9XVfGR5uSdToYBoweJbpPKOzy81ET

