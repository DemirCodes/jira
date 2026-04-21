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
create or replace function create_issues(
    p_project_id uuid,
    p_issue_title text,
    p_issue_description text default null,
    p_is_private boolean DEFAULT false
)
returns uuid
LANGUAGE plpgsql
security DEFINER
set search_path = PUBLIC
AS $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_issue_id uuid;
    v_issue_no bigint;
    v_issue_title text;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_project_name text;
    v_site_name text;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is NULL THEN
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue title validasyonu
    v_issue_title := trim(p_issue_title);

    if v_issue_title is null or length(v_issue_title) = 0 THEN
        raise EXCEPTION 'Issue title cannot be empty';
    end if;

    -- 3. Project kontrolü ve bilgileri al
    SELECT 
        p.site_id,
        p.project_name,
        p.is_private,
        s.org_id,
        s.is_private as site_is_private,
        s.site_name
    INTO 
        v_site_id,
        v_project_name,
        v_is_project_private,
        v_org_id,
        v_is_site_private,
        v_site_name
    FROM projects p
    JOIN sites s ON s.site_id = p.site_id
    WHERE p.project_id = p_project_id
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;

    if v_site_id is null THEN
        raise exception 'Project not found';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 5. Yetki kontrolü
    -- Org owner: her şeyi yapabilir
    -- Site admin: her şeyi yapabilir
    -- Project admin: her şeyi yapabilir
    -- Org admin: sadece site ve project private DEĞİLSE issue oluşturabilir
    
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site ve project private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot create issues in private sites or private projects';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to create issues in this project';
    END IF;

    -- 6. Issue number'ı bul (proje bazında sıralı)
    SELECT COALESCE(MAX(issue_no), 0) + 1 INTO v_issue_no
    FROM issues
    WHERE project_id = p_project_id
        AND deleted_at IS NULL;

    -- 7. Issue oluştur
    INSERT INTO issues (
        project_id,
        issue_no,
        issue_title,
        issue_description,
        status,
        priority,
        reporter_id,
        is_private,
        is_editable,
        created_at,
        updated_at
    )
    VALUES (
        p_project_id,
        v_issue_no,
        v_issue_title,
        p_issue_description,
        'open',
        'medium',
        v_user_id,
        p_is_private,
        true,
        now(),
        now()
    )
    RETURNING issue_id INTO v_issue_id;

    -- 8. Issue membership - oluşturan kişiyi contributor olarak ekle
    INSERT INTO issue_memberships (
        issue_id,
        user_id,
        role,
        membership_is_active,
        created_at,
        updated_at
    )
    VALUES (
        v_issue_id,
        v_user_id,
        'contributor',
        true,
        now(),
        now()
    );

    -- 9. Audit log
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
        'issue',
        v_issue_id,
        'CREATE',
        jsonb_build_object(
            'issue_title', v_issue_title,
            'issue_no', v_issue_no,
            'project_id', p_project_id,
            'project_name', v_project_name,
            'site_id', v_site_id,
            'site_name', v_site_name,
            'is_private', p_is_private
        ),
        now()
    );

    RETURN v_issue_id;
    
END;
$$;