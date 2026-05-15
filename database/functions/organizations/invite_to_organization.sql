DROP FUNCTION IF EXISTS invite_to_organization(uuid, uuid, text);

CREATE OR REPLACE FUNCTION invite_to_organization(
    p_org_id uuid,
    p_friendship_code uuid,
    p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_target_user_id uuid;
    v_user_role text;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- İşlemi yapanın rolünü kontrol et (sadece owner/admin)
    SELECT om.role::text INTO v_user_role
    FROM organization_memberships om
    WHERE om.org_id = p_org_id
      AND om.user_id = v_user_id
      AND om.membership_is_active = true
      AND om.deleted_at IS NULL;

    IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    -- Friendship code ile hedef kullanıcıyı bul
    SELECT user_id INTO v_target_user_id
    FROM users
    WHERE user_friendship_code = p_friendship_code
      AND user_is_active = true
      AND deleted_at IS NULL;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid friendship code or user not found';
    END IF;

    -- Zaten üye mi?
    IF EXISTS (
        SELECT 1 FROM organization_memberships
        WHERE org_id = p_org_id
          AND user_id = v_target_user_id
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User is already a member of this organization';
    END IF;

    -- Davetiye oluştur (direkt üye yap)
    INSERT INTO organization_memberships (
        org_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        p_org_id,
        v_target_user_id,
        p_role::org_role,
        v_user_id,
        true,
        now(),
        now(),
        now()
    );

    -- Audit log
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
        v_user_id,
        'organization_membership',
        p_org_id,
        'INVITE',
        jsonb_build_object(
            'invited_user_id', v_target_user_id,
            'role', p_role,
            'invited_by', v_user_id
        ),
        now()
    );

    RETURN v_target_user_id;
END;
$$;