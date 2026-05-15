-- Active: 1772756684414@@127.0.0.1@5432@jira
DROP FUNCTION IF EXISTS get_user_organizations(uuid);

CREATE OR REPLACE FUNCTION get_user_organizations(
    p_user_id uuid
)
RETURNS TABLE(
    org_id uuid,
    org_name text,
    org_description text,
    slug text,
    org_status text,
    created_at timestamptz,
    created_by uuid,
    user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Kullanıcı var mı?
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN QUERY
    SELECT 
        o.org_id,
        o.org_name,
        o.org_description,
        o.slug,
        o.org_status,
        o.created_at,
        o.created_by,
        om.role::text AS user_role
    FROM organizations o
    JOIN organization_memberships om ON om.org_id = o.org_id
    WHERE om.user_id = p_user_id
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL
      AND o.deleted_at IS NULL
    ORDER BY o.created_at DESC;
END;
$$;