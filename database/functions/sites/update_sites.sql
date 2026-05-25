-- update_site.sql
DROP FUNCTION IF EXISTS update_site (uuid, text, text, boolean);

CREATE OR REPLACE FUNCTION update_site(
    p_site_id uuid,
    p_site_name text DEFAULT NULL,
    p_site_slug text DEFAULT NULL,
    p_is_private boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_is_org_owner boolean;
    v_is_site_admin boolean;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Site'nin organizasyonunu bul
    SELECT org_id INTO v_org_id
    FROM sites
    WHERE site_id = p_site_id AND deleted_at IS NULL;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Site not found';
    END IF;

    -- Yetki kontrolü: org_owner veya site_admin
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);

    IF NOT (v_is_org_owner OR v_is_site_admin) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    -- Slug benzersizlik kontrolü
    IF p_site_slug IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM sites
            WHERE org_id = v_org_id
              AND site_slug = lower(trim(p_site_slug))
              AND site_id != p_site_id
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Slug already exists';
        END IF;
    END IF;

    UPDATE sites
    SET site_name = COALESCE(p_site_name, site_name),
        site_slug = COALESCE(lower(trim(p_site_slug)), site_slug),
        is_private = COALESCE(p_is_private, is_private),
        updated_at = now()
    WHERE site_id = p_site_id;

    RETURN FOUND;
END;
$$;