drop function if exists public.create_organization(uuid, text, text, text);
CREATE FUNCTION public.create_organization
(   
    p_user_id uuid, 
    p_org_name text, 
    p_slug text, 
    p_description text DEFAULT NULL::text
) 
RETURNS uuid
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