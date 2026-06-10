-- update_issues.sql

/*  
    update_issues.sql 
    dosyasında 
    issue güncellenecek

    kim güncelleyebilir:
    - org_owner: her şeyi güncelleyebilir
    - site_admin: her şeyi güncelleyebilir
    - project_admin: her şeyi güncelleyebilir
    - org_admin: sadece public site + public project + public issue güncelleyebilir
    - assignee: kendisine atanan issue'nun status ve priority'sini güncelleyebilir
    - reporter: kendi açtığı issue'nun title, description, is_private'ını güncelleyebilir

    güncellenebilecek kolonlar:
    - issue_title
    - issue_description
    - status
    - priority
    - assignee_id
    - is_private
*/

drop function if Exists update_issues(uuid, text, text, issue_status, priority_level, uuid, boolean, uuid);

CREATE OR REPLACE FUNCTION update_issues(
    p_issue_id uuid,
    p_issue_title text default null,
    p_issue_description text default null,
    p_status issue_status default null,
    p_priority priority_level default null,
    p_assignee_id uuid default null,
    p_is_private boolean default null,
    p_project_id uuid default null
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_user_id uuid;
    v_actual_project_id uuid;
    v_old_issue_title text;
    v_old_issue_description text;
    v_old_status issue_status;
    v_old_priority priority_level;
    v_old_assignee_id uuid;
    v_old_is_private boolean;
    v_issue_reporter_id uuid;
    v_is_project_admin boolean;
    v_is_issue_contributor boolean;
    v_changes jsonb;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;

    SELECT i.issue_title, i.issue_description, i.status, i.priority, i.assignee_id, i.is_private, i.reporter_id, i.project_id
    INTO v_old_issue_title, v_old_issue_description, v_old_status, v_old_priority, v_old_assignee_id, v_old_is_private, v_issue_reporter_id, v_actual_project_id
    FROM issues i WHERE i.issue_id = p_issue_id AND i.deleted_at IS NULL;

    IF v_actual_project_id IS NULL THEN RAISE EXCEPTION 'Issue not found or already deleted'; END IF;

    -- YETKİ KONTROLLERİ
    v_is_project_admin := EXISTS (SELECT 1 FROM project_memberships WHERE project_id = v_actual_project_id AND user_id = v_user_id AND role = 'project_admin' AND membership_is_active = true AND deleted_at IS NULL);
    v_is_issue_contributor := EXISTS (SELECT 1 FROM issue_memberships WHERE issue_id = p_issue_id AND user_id = v_user_id AND role = 'contributor' AND membership_is_active = true AND deleted_at IS NULL);

    IF v_is_project_admin THEN
        NULL; -- Admin can update everything
    ELSIF v_old_assignee_id = v_user_id THEN
        IF p_issue_title IS NOT NULL OR p_issue_description IS NOT NULL OR p_assignee_id IS NOT NULL OR p_is_private IS NOT NULL THEN
            RAISE EXCEPTION 'Permission denied: Assignee can only update status and priority';
        END IF;
    ELSIF v_issue_reporter_id = v_user_id THEN
        IF p_status IS NOT NULL OR p_priority IS NOT NULL OR p_assignee_id IS NOT NULL THEN
            RAISE EXCEPTION 'Permission denied: Reporter can only update title, description, and privacy status';
        END IF;
    ELSIF v_is_issue_contributor THEN
        NULL; -- Issue contributor can update fields
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to update this issue';
    END IF;

    -- Değişiklikleri hazırla
    v_changes := '{}'::jsonb;
    IF p_issue_title IS NOT NULL AND p_issue_title != v_old_issue_title THEN v_changes := v_changes || jsonb_build_object('issue_title', jsonb_build_object('old', v_old_issue_title, 'new', p_issue_title)); END IF;
    IF p_issue_description IS NOT NULL AND p_issue_description != v_old_issue_description THEN v_changes := v_changes || jsonb_build_object('issue_description', jsonb_build_object('old', v_old_issue_description, 'new', p_issue_description)); END IF;
    IF p_status IS NOT NULL AND p_status != v_old_status THEN v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_status, 'new', p_status)); END IF;
    IF p_priority IS NOT NULL AND p_priority != v_old_priority THEN v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', v_old_priority, 'new', p_priority)); END IF;
    IF p_assignee_id IS NOT NULL AND p_assignee_id != v_old_assignee_id THEN v_changes := v_changes || jsonb_build_object('assignee_id', jsonb_build_object('old', v_old_assignee_id, 'new', p_assignee_id)); END IF;
    IF p_is_private IS NOT NULL AND p_is_private != v_old_is_private THEN v_changes := v_changes || jsonb_build_object('is_private', jsonb_build_object('old', v_old_is_private, 'new', p_is_private)); END IF;

    IF v_changes = '{}'::jsonb THEN RAISE EXCEPTION 'No changes to update'; END IF;

    UPDATE issues SET 
        issue_title = coalesce(p_issue_title, issue_title),
        issue_description = coalesce(p_issue_description, issue_description),
        status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        assignee_id = coalesce(p_assignee_id, assignee_id),
        is_private = coalesce(p_is_private, is_private),
        updated_at = now()
    WHERE issue_id = p_issue_id;

    INSERT INTO system_audit_logs (actor_type, actor_id, entity_type, entity_id, action_type, old_value, new_value, created_at)
    VALUES ('tenant_user', v_user_id, 'issue', p_issue_id, 'UPDATE', v_changes, v_changes, now());

    RETURN true;
END;
$$;