-- accept_invitation.sql
CREATE OR REPLACE FUNCTION accept_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation record;
    v_user_id uuid;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    SELECT * INTO v_invitation
    FROM invitations
    WHERE invitation_id = p_invitation_id
      AND deleted_at IS NULL;

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    IF v_invitation.invited_user_id != v_user_id THEN
        RAISE EXCEPTION 'This invitation is not for you';
    END IF;

    IF v_invitation.status != 'pending' THEN
        RAISE EXCEPTION 'Invitation is already %', v_invitation.status;
    END IF;

    IF v_invitation.expires_at < now() THEN
        UPDATE invitations SET status = 'expired' WHERE invitation_id = p_invitation_id;
        RAISE EXCEPTION 'Invitation has expired';
    END IF;

    -- Üyeliği ekle
    IF v_invitation.entity_type = 'organization' THEN
        INSERT INTO organization_memberships (org_id, user_id, role, invited_by, membership_is_active, joined_at)
        VALUES (v_invitation.org_id, v_user_id, v_invitation.role::org_role, v_invitation.invited_by, true, now());
    ELSIF v_invitation.entity_type = 'site' THEN
        INSERT INTO site_memberships (site_id, user_id, role, invited_by, membership_is_active, joined_at)
        VALUES (v_invitation.entity_id, v_user_id, v_invitation.role::site_role, v_invitation.invited_by, true, now());
    END IF;

    -- Davet durumunu güncelle
    UPDATE invitations SET status = 'accepted', accepted_at = now()
    WHERE invitation_id = p_invitation_id;

    RETURN true;
END;
$$;