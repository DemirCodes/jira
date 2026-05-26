-- reject_invitation.sql
CREATE OR REPLACE FUNCTION reject_invitation(p_invitation_id uuid)
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
    WHERE invitation_id = p_invitation_id AND deleted_at IS NULL;

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    IF v_invitation.invited_user_id != v_user_id THEN
        RAISE EXCEPTION 'This invitation is not for you';
    END IF;

    IF v_invitation.status != 'pending' THEN
        RAISE EXCEPTION 'Invitation is already %', v_invitation.status;
    END IF;

    UPDATE invitations SET status = 'rejected', rejected_at = now()
    WHERE invitation_id = p_invitation_id;

    RETURN true;
END;
$$;