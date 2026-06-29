DROP FUNCTION IF EXISTS get_organization_stats(uuid);

CREATE OR REPLACE FUNCTION get_organization_stats(
    p_org_id uuid
)
RETURNS TABLE(
    total_members bigint,
    total_projects bigint,
    total_issues bigint,
    active_invitations bigint,
    created_at timestamptz
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

    -- Herhangi bir üye görebilir
    IF NOT EXISTS (
        SELECT 1 FROM organization_memberships
        WHERE org_id = p_org_id
          AND user_id = v_user_id
          AND membership_is_active = true
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM organization_memberships om 
         WHERE om.org_id = p_org_id AND om.membership_is_active = true AND om.deleted_at IS NULL)::bigint,
        (SELECT COUNT(*) FROM projects p 
         JOIN sites s ON s.site_id = p.site_id 
         WHERE s.org_id = p_org_id AND p.deleted_at IS NULL AND s.deleted_at IS NULL)::bigint,
        (SELECT COUNT(*) FROM issues i 
         JOIN projects p ON p.project_id = i.project_id 
         JOIN sites s ON s.site_id = p.site_id 
         WHERE s.org_id = p_org_id AND i.deleted_at IS NULL AND p.deleted_at IS NULL AND s.deleted_at IS NULL)::bigint,
        0::bigint,
        (SELECT o.created_at FROM organizations o WHERE o.org_id = p_org_id);
END;
$$;