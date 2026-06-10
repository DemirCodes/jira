-- invite_issues.sql

/*  
    invite_issues.sql 
    dosyasında 
    issue'ye kullanıcı davet edilecek (issue_memberships)

    kim davet edebilir:
    org_owner -> şart koşulmadan direk yapar tam yetki
    site_admin -> tam yetki
    project_admin -> tam yetki
    org_admin -> site ve project private değilse davet edebilir

    issue_role: contributor, reviewer, watcher
    User'lar user_friendship_code ile eklenir
    User organization_memberships'te yoksa eklenemez
    User site_memberships'te yoksa eklenemez
    User project_memberships'te yoksa eklenemez
*/

drop Function if Exists invite_issue(uuid, uuid, uuid, uuid, uuid, issue_role);

CREATE OR REPLACE FUNCTION invite_issue(
    p_friendship_code uuid,
    p_org_id uuid,  -- (Bu parametreleri arayüzden gönderiyorsan tuttum ama yetki kontrolü projedir)
    p_site_id uuid,
    p_project_id uuid,
    p_issue_id uuid,
    p_issue_role issue_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_user_in_project boolean;
BEGIN
    v_actor := auth_current_user_id();
    IF v_actor IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;

    -- Yetki: Ya Proje Admini ya da o issue'da yetkili olmalı
    IF NOT EXISTS (SELECT 1 FROM project_memberships WHERE project_id = p_project_id AND user_id = v_actor AND role = 'project_admin' AND deleted_at IS NULL) AND
       NOT EXISTS (SELECT 1 FROM issues WHERE issue_id = p_issue_id AND (reporter_id = v_actor OR assignee_id = v_actor) AND deleted_at IS NULL) AND
       NOT EXISTS (SELECT 1 FROM issue_memberships WHERE issue_id = p_issue_id AND user_id = v_actor AND role = 'contributor' AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this issue';
    END IF;

    SELECT user_id INTO v_target_user_id FROM users WHERE user_friendship_code = p_friendship_code AND deleted_at IS NULL AND user_is_active = true;
    IF v_target_user_id IS NULL THEN RAISE EXCEPTION 'Invalid friendship code or user not found'; END IF;

    -- Hedef kullanıcı projede mi? (Projede olmayan issue'ya giremez)
    SELECT EXISTS (SELECT 1 FROM project_memberships WHERE project_id = p_project_id AND user_id = v_target_user_id AND membership_is_active = true AND deleted_at IS NULL) INTO v_user_in_project;
    IF NOT v_user_in_project THEN RAISE EXCEPTION 'User must be an active member of the project first'; END IF;

    IF EXISTS (SELECT 1 FROM issue_memberships WHERE issue_id = p_issue_id AND user_id = v_target_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User already has a membership in this issue';
    END IF;

    INSERT INTO issue_memberships (issue_id, user_id, role, membership_is_active, created_at, updated_at)
    VALUES (p_issue_id, v_target_user_id, p_issue_role, true, now(), now());

    INSERT INTO system_audit_logs (actor_type, actor_id, entity_type, entity_id, action_type, new_value, created_at)
    VALUES ('tenant_user', v_actor, 'issue_membership', p_issue_id, 'INVITE', jsonb_build_object('user_id', v_target_user_id, 'role', p_issue_role), now());
END;
$$;