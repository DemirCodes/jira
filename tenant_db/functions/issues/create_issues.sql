-- create issues.sql

-- when created issues this functions will be started

/*  
    create_issues.sql 
    dosyasında 
    issue olusturulacak.

    kim yapabilir:
    org_owner -> şart koşulmadan direk yapar tam yetki
    org_admin -> site ve project private değilse issue ya baglı olan
    site_admin -> tam yetki
    project_admin -> tam yetki
*/

-- they can be create same issue_title


drop function if EXISTS create_issues(uuid, text, text, boolean);
CREATE OR REPLACE FUNCTION create_issues(
    p_project_id uuid,
    p_issue_title text,
    p_issue_description text default null,
    p_is_private boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_user_id uuid;
    v_site_id uuid;
    v_issue_id uuid;
    v_issue_no bigint;
    v_issue_title text;
    v_is_project_private boolean;
    v_project_name text;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;

    -- 2. Issue title validasyonu
    v_issue_title := trim(p_issue_title);
    IF v_issue_title IS NULL OR length(v_issue_title) = 0 THEN RAISE EXCEPTION 'Issue title cannot be empty'; END IF;

    -- 3. Project kontrolü ve bilgileri al
    SELECT p.site_id, p.project_name, p.is_private
    INTO v_site_id, v_project_name, v_is_project_private
    FROM projects p
    WHERE p.project_id = p_project_id AND p.deleted_at IS NULL;

    IF v_site_id IS NULL THEN RAISE EXCEPTION 'Project not found'; END IF;

    -- 4. YETKİ KONTROLÜ: Sadece Project Admin veya Project Contributor
    IF NOT EXISTS (
        SELECT 1 FROM project_memberships 
        WHERE project_id = p_project_id 
          AND user_id = v_user_id 
          AND role IN ('project_admin', 'contributor') 
          AND membership_is_active = true 
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Permission denied: Only Project Admin or Contributor can create issues in this project';
    END IF;

    -- 5. Issue number'ı bul
    SELECT COALESCE(MAX(issue_no), 0) + 1 INTO v_issue_no
    FROM issues
    WHERE project_id = p_project_id AND deleted_at IS NULL;

    -- 6. Issue oluştur
    INSERT INTO issues (project_id, issue_no, issue_title, issue_description, status, priority, reporter_id, is_private, is_editable, created_at, updated_at)
    VALUES (p_project_id, v_issue_no, v_issue_title, p_issue_description, 'open', 'medium', v_user_id, p_is_private, true, now(), now())
    RETURNING issue_id INTO v_issue_id;

    -- 7. Issue membership - oluşturan kişiyi contributor olarak ekle
    INSERT INTO issue_memberships (issue_id, user_id, role, membership_is_active, created_at, updated_at)
    VALUES (v_issue_id, v_user_id, 'contributor', true, now(), now());

    -- 8. Audit log
    INSERT INTO system_audit_logs (actor_type, actor_id, entity_type, entity_id, action_type, new_value, created_at)
    VALUES ('tenant_user', v_user_id, 'issue', v_issue_id, 'CREATE', jsonb_build_object('issue_title', v_issue_title, 'issue_no', v_issue_no, 'project_id', p_project_id, 'is_private', p_is_private), now());

    RETURN v_issue_id;
END;
$$;