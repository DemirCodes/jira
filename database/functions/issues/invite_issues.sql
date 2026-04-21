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

CREATE OR REPLACE FUNCTION invite_issue(
    p_friendship_code uuid,
    p_org_id uuid,
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
    v_is_issue_private boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_user_in_org boolean;
    v_user_in_site boolean;
    v_user_in_project boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
BEGIN
    -- 1. Aktör kontrolü
    v_actor := auth_current_user_id();
    
    IF v_actor IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 2. Friendship code ile hedef kullanıcıyı bul
    SELECT user_id INTO v_target_user_id
    FROM users
    WHERE user_friendship_code = p_friendship_code
        AND deleted_at IS NULL
        AND user_is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid friendship code or user not found';
    END IF;

    -- 3. Issue, project, site bilgilerini ve private durumlarını al
    SELECT 
        i.is_private as issue_is_private,
        p.is_private as project_is_private,
        s.is_private as site_is_private
    INTO 
        v_is_issue_private,
        v_is_project_private,
        v_is_site_private
    FROM issues i
    JOIN projects p ON p.project_id = i.project_id
    JOIN sites s ON s.site_id = p.site_id
    WHERE i.issue_id = p_issue_id
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL;
    
    IF v_is_issue_private IS NULL THEN
        RAISE EXCEPTION 'Issue not found';
    END IF;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 5. Yetki kontrolü
    IF v_is_org_owner OR v_is_site_admin OR v_is_project_admin THEN
        -- Tam yetkililer, devam et
        NULL;
    ELSIF v_is_org_admin THEN
        -- Org admin: site, project, issue private kontrolü
        IF v_is_site_private = true OR v_is_project_private = true OR v_is_issue_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot invite users to private sites, projects, or issues';
        END IF;
        -- Devam et, yetkili
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this issue';
    END IF;

    -- 6. Hedef kullanıcının organization'da üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = p_org_id
            AND om.user_id = v_target_user_id
            AND om.membership_is_active = true
            AND om.deleted_at IS NULL
    ) INTO v_user_in_org;
    
    IF NOT v_user_in_org THEN
        RAISE EXCEPTION 'User must be an active member of the organization first';
    END IF;

    -- 7. Hedef kullanıcının site'de üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM site_memberships sm
        WHERE sm.site_id = p_site_id
            AND sm.user_id = v_target_user_id
            AND sm.membership_is_active = true
            AND sm.deleted_at IS NULL
    ) INTO v_user_in_site;
    
    IF NOT v_user_in_site THEN
        RAISE EXCEPTION 'User must be an active member of the site first';
    END IF;

    -- 8. Hedef kullanıcının project'te üye olup olmadığını kontrol et
    SELECT EXISTS (
        SELECT 1
        FROM project_memberships pm
        WHERE pm.project_id = p_project_id
            AND pm.user_id = v_target_user_id
            AND pm.membership_is_active = true
            AND pm.deleted_at IS NULL
    ) INTO v_user_in_project;
    
    IF NOT v_user_in_project THEN
        RAISE EXCEPTION 'User must be an active member of the project first';
    END IF;

    -- 9. Zaten issue membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM issue_memberships im
        WHERE im.issue_id = p_issue_id
            AND im.user_id = v_target_user_id
            AND im.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this issue';
    END IF;

    -- 10. Issue membership ekle
    INSERT INTO issue_memberships (
        issue_id,
        user_id,
        role,
        membership_is_active,
        created_at,
        updated_at
    )
    VALUES (
        p_issue_id,
        v_target_user_id,
        p_issue_role,
        true,
        now(),
        now()
    );

    -- 11. Audit log
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
        v_actor,
        'issue_membership',
        p_issue_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'issue_id', p_issue_id,
            'project_id', p_project_id,
            'site_id', p_site_id,
            'role', p_issue_role,
            'invited_by', v_actor
        ),
        now()
    );
    
END;
$$;