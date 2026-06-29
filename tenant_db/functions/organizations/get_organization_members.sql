-- Active: 1772756684414@@127.0.0.1@5432@jira
DROP FUNCTION IF EXISTS get_organization_members(uuid);

CREATE OR REPLACE FUNCTION get_organization_members(p_org_id uuid)
RETURNS TABLE(
    user_id uuid,
    user_name text,
    user_email text,
    role text,
    joined_at timestamptz,
    invited_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Kullanıcının bu organizasyondaki rolünü al
    SELECT om.role::text INTO v_user_role
    FROM organization_memberships om
    WHERE om.org_id = p_org_id
      AND om.user_id = v_user_id
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL;

    -- Rol kontrolü: SADECE owner ve admin görebilir
    IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    RETURN QUERY
    SELECT 
        om.user_id,
        u.user_name,
        u.user_email::text,
        om.role::text,
        om.joined_at,
        om.invited_by
    FROM organization_memberships om
    JOIN users u ON u.user_id = om.user_id
    WHERE om.org_id = p_org_id
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL
      AND u.deleted_at IS NULL
    ORDER BY om.joined_at ASC;
END;
$$;