

CREATE OR REPLACE FUNCTION list_sites
(
    p_org_id uuid default null
) 
RETURNS TABLE(
    site_id uuid,
    site_name text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
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
