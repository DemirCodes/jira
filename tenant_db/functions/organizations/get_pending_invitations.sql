DROP FUNCTION IF EXISTS get_pending_invitations(uuid);

CREATE OR REPLACE FUNCTION get_pending_invitations(
    p_org_id uuid
)
RETURNS TABLE(
    invitation_id uuid,
    organization_id uuid,
    invited_user_id uuid,
    invited_by_user_id uuid,
    role text,
    status text,
    created_at timestamptz,
    expires_at timestamptz
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

    -- Sadece owner/admin görebilir
    SELECT om.role::text INTO v_user_role
    FROM organization_memberships om
    WHERE om.org_id = p_org_id
      AND om.user_id = v_user_id
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL;

    IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    -- Şimdilik boş dön (invitation tablosu yoksa)
    -- İleride invitations tablosu eklenince güncellenecek
    RETURN QUERY
    SELECT 
        gen_random_uuid()::uuid,
        p_org_id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        v_user_id,
        'member'::text,
        'pending'::text,
        now()::timestamptz,
        (now() + interval '7 days')::timestamptz
    WHERE false;
END;
$$;