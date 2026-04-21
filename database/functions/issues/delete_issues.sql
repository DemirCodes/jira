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

create or replace function delete_issues(
    p_issue_id uuid,
    p_project_id uuid default null
)
returns boolean
LANGUAGE plpgsql
security DEFINER
set search_path = PUBLIC
AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_issue_title text;
    v_issue_status issue_status;
    v_project_name text;           -- 👈 EKSİK OLAN SATIR
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is NULL THEN
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue kontrolü ve bilgileri al
    SELECT 
        i.issue_title,
        i.status,
        p.site_id,
        p.project_name,
        p.is_private as project_is_private,
        s.org_id,
        s.is_private as site_is_private
    INTO 
        v_issue_title,
        v_issue_status,
        v_site_id,
        v_project_name,            -- 👈 ARTIK TANIMLI
        v_is_project_private,
        v_org_id,
        v_is_site_private
    FROM issues i
    JOIN projects p ON p.project_id = i.project_id
    JOIN sites s ON s.site_id = p.site_id
    WHERE i.issue_id = p_issue_id
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;

    if v_site_id is NULL THEN
        raise exception 'Issue not found or already deleted';
    end if;

    -- 3. Project ID kontrolü (parametre varsa)
    if p_project_id is not null and p_project_id != (SELECT project_id FROM issues WHERE issue_id = p_issue_id) then
        raise exception 'Issue does not belong to the specified project';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin((SELECT project_id FROM issues WHERE issue_id = p_issue_id));

    -- 5. Yetki kontrolü
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site ve project private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot delete issues in private sites or private projects';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to delete issues';
    END IF;

    -- 6. Issue status kontrolü (isteğe bağlı)
    -- open/in_progress/in_review durumundaki issue'lar için uyarı (ama yine de silebilir)
    IF v_issue_status IN ('open', 'in_progress', 'in_review') THEN
        -- Sadece uyarı ver, silmeyi engelleme
        RAISE NOTICE 'Warning: Deleting an issue with status "%"', v_issue_status;
    END IF;

    -- 7. Soft delete - issue'yu sil
    UPDATE issues
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        updated_at = now()
    WHERE issue_id = p_issue_id;

    -- 8. Issue memberships'leri soft delete
    UPDATE issue_memberships
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    WHERE issue_id = p_issue_id
        AND deleted_at IS NULL;

    -- 9. Issue assets'leri soft delete
    UPDATE issue_assets
    SET 
        deleted_at = now(),
        deleted_by = v_user_id,
        is_active = false,
        updated_at = now()
    WHERE issue_id = p_issue_id
        AND deleted_at IS NULL;

    -- 10. Audit log
    INSERT INTO system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    VALUES (
        'tenant_user',
        v_user_id,
        'issue',
        p_issue_id,
        'DELETE',
        jsonb_build_object(
            'issue_title', v_issue_title,
            'issue_status', v_issue_status
        ),
        jsonb_build_object(
            'issue_id', p_issue_id,
            'deleted_by', v_user_id,
            'deleted_at', now()
        ),
        now()
    );

    RETURN true;
    
END;
$$;