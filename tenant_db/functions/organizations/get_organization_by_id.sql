-- Active: 1772756684414@@127.0.0.1@5432@jira

-- 3. get_organization_by_id (p_uid düzeltmesi)
DROP FUNCTION IF EXISTS get_organization_by_id(uuid, uuid);

CREATE OR REPLACE FUNCTION get_organization_by_id(
    p_org_id uuid,
    p_uid uuid
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
    IF NOT EXISTS (
        SELECT 1 FROM organization_memberships
        WHERE org_id = p_org_id
          AND user_id = p_uid
          AND membership_is_active = true
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
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
    WHERE o.org_id = p_org_id
      AND om.user_id = p_uid
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL
      AND o.deleted_at IS NULL
    LIMIT 1;
END;
$$;