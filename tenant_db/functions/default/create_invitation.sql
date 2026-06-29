-- create_invitation.sql
CREATE OR REPLACE FUNCTION create_invitation(
    p_org_id uuid,
    p_friendship_code uuid,
    p_entity_type text,
    p_entity_id uuid,
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
    v_invitation_id uuid;
    v_user_role text;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Yetki kontrolü: org owner/admin olmalı
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
    IF p_entity_type = 'organization' THEN
        IF EXISTS (
            SELECT 1 FROM organization_memberships
            WHERE org_id = p_org_id AND user_id = v_target_user_id AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'User is already a member of this organization';
        END IF;
    END IF;

    -- Bekleyen davet var mı?
    IF EXISTS (
        SELECT 1 FROM invitations
        WHERE org_id = p_org_id
          AND invited_user_id = v_target_user_id
          AND entity_type = p_entity_type
          AND COALESCE(entity_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_entity_id, '00000000-0000-0000-0000-000000000000')
          AND status = 'pending'
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'A pending invitation already exists for this user';
    END IF;

    -- Daveti oluştur
    INSERT INTO invitations (org_id, invited_by, invited_user_id, entity_type, entity_id, role)
    VALUES (p_org_id, v_user_id, v_target_user_id, p_entity_type, p_entity_id, p_role)
    RETURNING invitation_id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$;