-- delete issues.sql

-- when deleted issues this functions will be started

/*  
    delete_issues.sql 
    dosyasında 
    issue silinecek (soft delete)

    kim silebilir:
    org_owner -> şart koşulmadan direk yapar tam yetki
    site_admin -> tam yetki
    project_admin -> tam yetki
    org_admin -> site ve project private değilse silebilir

    issue_status kuralları:
    - closed: soft delete yapılabilir
    - fixed: soft delete yapılabilir
    - rejected: soft delete yapılabilir
    - open/in_progress/in_review: SADECE yetkililer silebilir
*/

drop FUNCTION IF EXISTS delete_issues(uuid, uuid);
CREATE OR REPLACE FUNCTION delete_issues(
    p_issue_id uuid,
    p_project_id uuid default null
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_user_id uuid;
    v_issue_title text;
    v_issue_status issue_status;
    v_actual_project_id uuid;
BEGIN
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;

    SELECT i.issue_title, i.status, i.project_id
    INTO v_issue_title, v_issue_status, v_actual_project_id
    FROM issues i
    WHERE i.issue_id = p_issue_id AND i.deleted_at IS NULL;

    IF v_actual_project_id IS NULL THEN RAISE EXCEPTION 'Issue not found or already deleted'; END IF;
    IF p_project_id IS NOT NULL AND p_project_id != v_actual_project_id THEN RAISE EXCEPTION 'Issue does not belong to the specified project'; END IF;

    -- YETKİ KONTROLÜ: Sadece Project Admin silebilir
    IF NOT EXISTS (
        SELECT 1 FROM project_memberships 
        WHERE project_id = v_actual_project_id AND user_id = v_user_id AND role = 'project_admin' AND membership_is_active = true AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Permission denied: Only Project Admin can delete issues';
    END IF;

    IF v_issue_status IN ('open', 'in_progress', 'in_review') THEN
        RAISE NOTICE 'Warning: Deleting an issue with status "%"', v_issue_status;
    END IF;

    UPDATE issues SET deleted_at = now(), deleted_by = v_user_id, updated_at = now() WHERE issue_id = p_issue_id;
    UPDATE issue_memberships SET deleted_at = now(), deleted_by = v_user_id, membership_is_active = false, updated_at = now() WHERE issue_id = p_issue_id AND deleted_at IS NULL;
    UPDATE issue_assets SET deleted_at = now(), deleted_by = v_user_id, is_active = false, updated_at = now() WHERE issue_id = p_issue_id AND deleted_at IS NULL;

    INSERT INTO system_audit_logs (actor_type, actor_id, entity_type, entity_id, action_type, old_value, new_value, created_at)
    VALUES ('tenant_user', v_user_id, 'issue', p_issue_id, 'DELETE', jsonb_build_object('issue_title', v_issue_title, 'issue_status', v_issue_status), jsonb_build_object('issue_id', p_issue_id, 'deleted_by', v_user_id, 'deleted_at', now()), now());

    RETURN true;
END;
$$;