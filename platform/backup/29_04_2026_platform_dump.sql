--
-- PostgreSQL database dump
--

\restrict xsw3ls1hDBZQVuiG4eVT27zklJhWimogsgvtqwVpe45DYP24N81IZR8juom3Oyc

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

-- Started on 2026-04-29 15:11:10 +03

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
-- TOC entry 2 (class 3079 OID 18371)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 912 (class 1247 OID 18477)
-- Name: platform_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'support_admin',
    'billing_admin'
);


ALTER TYPE public.platform_role OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 18550)
-- Name: auth_current_platform_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_current_platform_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
	select current_setting('app.current_platform_user_id')::uuid;
$$;


ALTER FUNCTION public.auth_current_platform_user_id() OWNER TO postgres;

--
-- TOC entry 234 (class 1255 OID 18611)
-- Name: auth_is_platform_billing_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_platform_billing_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
	select exists
	(
		select
			1
		from 
			platform_users
		where
			platform_user_id = auth_current_platform_user_id()
			and
			role = 'billing_admin'
			and
			is_active = true
			and
			deleted_at is null
	);
$$;


ALTER FUNCTION public.auth_is_platform_billing_admin() OWNER TO postgres;

--
-- TOC entry 266 (class 1255 OID 18613)
-- Name: auth_is_platform_super_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_platform_super_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
	select exists (
		select 
			1
		from
			platform_users
		where
			platform_user_id = auth_current_platform_user_id()
			and
			role = 'super_admin'
			and
			is_active = true
			and
			deleted_at is null
	);
$$;


ALTER FUNCTION public.auth_is_platform_super_admin() OWNER TO postgres;

--
-- TOC entry 225 (class 1255 OID 18615)
-- Name: auth_is_platform_support_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_is_platform_support_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
	select	exists(
		select
			1
		from	
			platform_users
		where
			platform_user_id = auth_current_platform_user_id()
			and
			role = 'support_admin'
			and
			is_active = true
			and
			deleted_at is null
	);
$$;


ALTER FUNCTION public.auth_is_platform_support_admin() OWNER TO postgres;

--
-- TOC entry 257 (class 1255 OID 18618)
-- Name: change_platform_password(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.change_platform_password(p_user_id uuid, p_old_password_hash text, p_new_password_hash text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_current_hash text;
BEGIN
    -- Kendi şifresini değiştirebilir veya super_admin herkesi değiştirebilir
    IF p_user_id != auth_current_platform_user_id() 
       AND NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Kendi şifresini değiştiriyorsa eski şifreyi kontrol et
    IF p_user_id = auth_current_platform_user_id() THEN
        SELECT password_hash INTO v_current_hash
        FROM platform_users
        WHERE platform_user_id = p_user_id
            AND deleted_at IS NULL;
        
        IF v_current_hash != p_old_password_hash THEN
            RAISE EXCEPTION 'Old password is incorrect';
        END IF;
    END IF;
    
    UPDATE platform_users
    SET password_hash = p_new_password_hash,
        updated_at = now()
    WHERE platform_user_id = p_user_id
        AND deleted_at IS NULL;
    
    -- Tüm session'ları iptal et (güvenlik için)
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE platform_user_id = p_user_id
        AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.change_platform_password(p_user_id uuid, p_old_password_hash text, p_new_password_hash text) OWNER TO postgres;

--
-- TOC entry 241 (class 1255 OID 18552)
-- Name: create_api_key(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_api_key(p_platform_user_id uuid, p_key_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_api_key text;
BEGIN
    -- Sadece super_admin veya kendi API key'ini oluşturabilir
    IF NOT (auth_is_platform_super_admin() OR p_platform_user_id = auth_current_platform_user_id()) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    v_api_key := encode(gen_random_bytes(32), 'hex');

    INSERT INTO api_keys (platform_user_id, key_name, api_key_hash)
    VALUES (p_platform_user_id, p_key_name, crypt(v_api_key, gen_salt('bf')));

    RETURN v_api_key;
END;
$$;


ALTER FUNCTION public.create_api_key(p_platform_user_id uuid, p_key_name text) OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 18619)
-- Name: create_platorm_user(public.citext, text, public.platform_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_platorm_user(p_email public.citext, p_password_hash text, p_role public.platform_role) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
	v_user_id uuid;
	v_actor_id uuid;
begin
	v_actor_id := auth_current_platform_user_id();

	if v_actor_id is null then
		raise exception 'User not authenticated';
	end if;

	if not auth_is_platform_super_admin() then
		raise exception 'Only super admin can create platform users';
	end if;


	insert into 
		platform_user
		(
			email,
			password_hash,
			role,
			is_active
		)
	values
		(
			p_email,
			p_password_hash,
			p_role,
			true
		)
	returning
		platform_user_id 
	into
		v_user_id;


	return v_user_id;
end;
$$;


ALTER FUNCTION public.create_platorm_user(p_email public.citext, p_password_hash text, p_role public.platform_role) OWNER TO postgres;

--
-- TOC entry 236 (class 1255 OID 18620)
-- Name: delete_platform_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_platform_user(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Only super admin can delete platform users';
    END IF;
    
    UPDATE platform_users
    SET deleted_at = now(), is_active = false
    WHERE platform_user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.delete_platform_user(p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 251 (class 1255 OID 18621)
-- Name: get_platform_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_platform_user(p_user_id uuid) RETURNS TABLE(platform_user_id uuid, email public.citext, role public.platform_role, is_active boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
	if not auth_is_platform_super_admin() then
		raise exception 'Only super admin can view platform users';
	end if;

	return query
	select
		pu.platform_user_id,
		pu.email,
		pu.role,
		pu.is_active,
		pu.created_at
	from
		platform_users as pu
	where
		pu.platform_user_id = p_user_id
		and
		pu.deleted_at is null;
end;
$$;


ALTER FUNCTION public.get_platform_user(p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 18622)
-- Name: list_api_keys(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_api_keys(p_platform_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(api_key_id uuid, platform_user_id uuid, key_name text, last_used_at timestamp with time zone, expires_at timestamp with time zone, is_active boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Sadece super_admin tüm API key'leri görebilir
    IF NOT auth_is_platform_super_admin() THEN
        -- Normal kullanıcı sadece kendi key'lerini görebilir
        IF p_platform_user_id IS NULL OR p_platform_user_id != auth_current_platform_user_id() THEN
            RAISE EXCEPTION 'Permission denied';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT a.api_key_id, a.platform_user_id, a.key_name, 
           a.last_used_at, a.expires_at, a.is_active, a.created_at
    FROM api_keys a
    WHERE (p_platform_user_id IS NULL OR a.platform_user_id = p_platform_user_id)
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.list_api_keys(p_platform_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- TOC entry 228 (class 1255 OID 18623)
-- Name: list_platform_users(public.platform_role, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_platform_users(p_role public.platform_role DEFAULT NULL::public.platform_role, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(platform_user_id uuid, email public.citext, role public.platform_role, is_active boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
	if not auth_is_platform_super_admin() then
		raise exception 'Only super admin can list platform users';
	end if;

	return query
	select
		pu.platform_user_id,
		pu.email,
		pu.role,
		pu.is_active,
		pu.created_at
	from
		platform_users as pu
	where
		(
			p_role is null or pu.role = p_role
		)
		and
		pu.deleted_at is null
	order by
		pu.created_at desc
	limit p_limit offset p_offset;
end;
$$;


ALTER FUNCTION public.list_platform_users(p_role public.platform_role, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- TOC entry 292 (class 1255 OID 18616)
-- Name: platform_login(public.citext, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.platform_login(p_email public.citext, p_password_hash text) RETURNS TABLE(token text, platform_user_id uuid, role public.platform_role)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user record;
    v_token text;
BEGIN
    SELECT * INTO v_user
    FROM platform_users
    WHERE email = p_email
        AND password_hash = p_password_hash
        AND is_active = true
        AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;
    
    v_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_sessions (platform_user_id, token, expires_at)
    VALUES (v_user.platform_user_id, v_token, now() + interval '7 days');
    
    RETURN QUERY SELECT v_token, v_user.platform_user_id, v_user.role;
END;
$$;


ALTER FUNCTION public.platform_login(p_email public.citext, p_password_hash text) OWNER TO postgres;

--
-- TOC entry 287 (class 1255 OID 18617)
-- Name: platform_logout(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.platform_logout(p_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE token = p_token AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.platform_logout(p_token text) OWNER TO postgres;

--
-- TOC entry 260 (class 1255 OID 18624)
-- Name: refresh_platform_token(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_platform_token(p_old_token text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
    v_new_token text;
BEGIN
    -- Eski token'ı doğrula
    SELECT platform_user_id INTO v_user_id
    FROM user_sessions
    WHERE token = p_old_token
        AND expires_at > now()
        AND revoked_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    -- Eski token'ı iptal et
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE token = p_old_token;
    
    -- Yeni token oluştur
    v_new_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_sessions (platform_user_id, token, expires_at)
    VALUES (v_user_id, v_new_token, now() + interval '7 days');
    
    RETURN v_new_token;
END;
$$;


ALTER FUNCTION public.refresh_platform_token(p_old_token text) OWNER TO postgres;

--
-- TOC entry 254 (class 1255 OID 18625)
-- Name: reset_platform_password_confirm(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_platform_password_confirm(p_token text, p_new_password_hash text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT platform_user_id INTO v_user_id
    FROM password_reset_tokens
    WHERE token = p_token
        AND expires_at > now()
        AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    UPDATE platform_users
    SET password_hash = p_new_password_hash,
        updated_at = now()
    WHERE platform_user_id = v_user_id;
    
    -- Token'ı kullanıldı olarak işaretle
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE token = p_token;
    
    -- Tüm session'ları iptal et
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE platform_user_id = v_user_id
        AND revoked_at IS NULL;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.reset_platform_password_confirm(p_token text, p_new_password_hash text) OWNER TO postgres;

--
-- TOC entry 278 (class 1255 OID 18626)
-- Name: reset_platform_password_request(public.citext); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_platform_password_request(p_email public.citext) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_token text;
    v_user_id uuid;
BEGIN
    SELECT platform_user_id INTO v_user_id
    FROM platform_users
    WHERE email = p_email
        AND is_active = true
        AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email not found';
    END IF;
    
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Önce eski token'ları temizle
    DELETE FROM password_reset_tokens 
    WHERE platform_user_id = v_user_id;
    
    INSERT INTO password_reset_tokens (platform_user_id, token, expires_at)
    VALUES (v_user_id, v_token, now() + interval '1 hour');
    
    RETURN v_token;
END;
$$;


ALTER FUNCTION public.reset_platform_password_request(p_email public.citext) OWNER TO postgres;

--
-- TOC entry 293 (class 1255 OID 18553)
-- Name: revoke_api_key(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.revoke_api_key(p_api_key uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    select 
        platform_user_id 
    into
        v_user_id
    from
        api_keys
    where
        api_key_id = p_api_key_id
        and
        is_active = true;

    if not found then 
        raise exception 'API key not found';
    end if;

    if not 
        (
            auth_platform_is_super_admin()
        )
        or
        v_user_id = auth_current_platform_user_id()
        then
            raise exception 'Permission denied';
    end if;

    update 
        api_keys
    SET
        is_active = FALSE
    where 
        api_key_id = p_api_key_id;
    
    return true;
end;
$$;


ALTER FUNCTION public.revoke_api_key(p_api_key uuid) OWNER TO postgres;

--
-- TOC entry 294 (class 1255 OID 18627)
-- Name: update_platform_user(uuid, public.citext, public.platform_role, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_platform_user(p_user_id uuid, p_email public.citext DEFAULT NULL::public.citext, p_role public.platform_role DEFAULT NULL::public.platform_role, p_is_active boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Only super admin can update platform users';
    END IF;
    
    UPDATE platform_users
    SET 
        email = COALESCE(p_email, email),
        role = COALESCE(p_role, role),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE platform_user_id = p_user_id
        AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_platform_user(p_user_id uuid, p_email public.citext, p_role public.platform_role, p_is_active boolean) OWNER TO postgres;

--
-- TOC entry 252 (class 1255 OID 18628)
-- Name: verify_platform_token(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verify_platform_token(p_token text) RETURNS TABLE(platform_user_id uuid, role public.platform_role)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT s.platform_user_id, u.role
    FROM user_sessions s
    JOIN platform_users u ON u.platform_user_id = s.platform_user_id
    WHERE s.token = p_token
        AND s.expires_at > now()
        AND s.revoked_at IS NULL
        AND u.is_active = true
        AND u.deleted_at IS NULL;
END;
$$;


ALTER FUNCTION public.verify_platform_token(p_token text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 18512)
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    api_key_id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform_user_id uuid,
    key_name text NOT NULL,
    api_key_hash text NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 18527)
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    attempt_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    ip_address inet,
    success boolean DEFAULT false,
    attempted_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 18483)
-- Name: platform_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_users (
    platform_user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    role public.platform_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid
);


ALTER TABLE public.platform_users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 18496)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform_user_id uuid,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 18554)
-- Name: platform_activity_log; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.platform_activity_log AS
 SELECT 'login'::text AS event_type,
    la.email,
    (la.success)::text AS status,
    la.attempted_at AS event_time
   FROM (public.login_attempts la
     JOIN public.platform_users pu ON ((pu.email OPERATOR(public.=) la.email)))
UNION ALL
 SELECT 'session'::text AS event_type,
    pu.email,
        CASE
            WHEN (s.revoked_at IS NULL) THEN 'active'::text
            ELSE 'revoked'::text
        END AS status,
    s.created_at AS event_time
   FROM (public.user_sessions s
     JOIN public.platform_users pu ON ((pu.platform_user_id = s.platform_user_id)));


ALTER VIEW public.platform_activity_log OWNER TO postgres;

--
-- TOC entry 3551 (class 0 OID 18512)
-- Dependencies: 218
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_keys (api_key_id, platform_user_id, key_name, api_key_hash, last_used_at, expires_at, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 3552 (class 0 OID 18527)
-- Dependencies: 219
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (attempt_id, email, ip_address, success, attempted_at) FROM stdin;
\.


--
-- TOC entry 3549 (class 0 OID 18483)
-- Dependencies: 216
-- Data for Name: platform_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_users (platform_user_id, email, password_hash, role, is_active, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- TOC entry 3550 (class 0 OID 18496)
-- Dependencies: 217
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, platform_user_id, token, expires_at, created_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 3400 (class 2606 OID 18521)
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (api_key_id);


--
-- TOC entry 3402 (class 2606 OID 18536)
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (attempt_id);


--
-- TOC entry 3392 (class 2606 OID 18495)
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- TOC entry 3394 (class 2606 OID 18493)
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (platform_user_id);


--
-- TOC entry 3396 (class 2606 OID 18504)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 3398 (class 2606 OID 18506)
-- Name: user_sessions user_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_key UNIQUE (token);


--
-- TOC entry 3404 (class 2606 OID 18522)
-- Name: api_keys api_keys_platform_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_platform_user_id_fkey FOREIGN KEY (platform_user_id) REFERENCES public.platform_users(platform_user_id) ON DELETE CASCADE;


--
-- TOC entry 3403 (class 2606 OID 18507)
-- Name: user_sessions user_sessions_platform_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_platform_user_id_fkey FOREIGN KEY (platform_user_id) REFERENCES public.platform_users(platform_user_id) ON DELETE CASCADE;


-- Completed on 2026-04-29 15:11:10 +03

--
-- PostgreSQL database dump complete
--

\unrestrict xsw3ls1hDBZQVuiG4eVT27zklJhWimogsgvtqwVpe45DYP24N81IZR8juom3Oyc

