/*
    Project Membership sadece şunlar davet edebilir:
    - project_admin
    - org_owner
    - site_admin (eğer project private değilse)
    - org_admin (eğer site_admin ise ve project private değilse)

    Kurallar:
    1. auth_is_org_owner: her zaman ekleyebilir (is_private kontrolü yok)
    2. auth_is_project_admin: her zaman ekleyebilir (is_private kontrolü yok)
    3. auth_is_site_admin: sadece project private değilse ekleyebilir
    4. auth_is_org_admin: sadece site_admin ise ve project private değilse ekleyebilir
    5. User'lar user_friendship_code ile eklenir
    6. User organization_memberships'te yoksa project_memberships'e eklenemez
    7. User site_memberships'te yoksa (site üyesi değilse) eklenemez





    çift yetkili durumlarına göre değişiklik yapılacak
*/

CREATE OR REPLACE FUNCTION invite_project(
    p_friendship_code uuid,
    p_org_id uuid,
    p_site_id uuid,
    p_project_id uuid,
    p_project_role project_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_is_project_private boolean;
    v_user_in_org boolean;
    v_user_in_site boolean;
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

    -- 3. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);

    -- 4. Yetki kontrolü - en az birine sahip olmalı
    IF NOT (v_is_org_owner OR v_is_org_admin OR v_is_site_admin OR v_is_project_admin) THEN
        RAISE EXCEPTION 'Permission denied: Only org owner, org admin, site admin, or project admin can invite users';
    END IF;

    -- 5. Project'in private olup olmadığını kontrol et
    SELECT is_private INTO v_is_project_private
    FROM projects
    WHERE project_id = p_project_id
        AND deleted_at IS NULL;
    
    IF v_is_project_private IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

     -- 6. Yetki kontrolü (basit ve net)
    IF v_is_project_private = true THEN
        -- Özel proje: sadece org_owner veya project_admin
        IF NOT (v_is_org_owner OR v_is_project_admin) THEN
            RAISE EXCEPTION 'Permission denied: Only org owner or project admin can invite users to private projects';
        END IF;
    ELSE
        -- Herkese açık proje: org_owner, project_admin, site_admin, org_admin yetkili
        IF NOT (v_is_org_owner OR v_is_project_admin OR v_is_site_admin OR v_is_org_admin) THEN
            RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this project';
        END IF;
    END IF;



    -- 7. Hedef kullanıcının organization'da üye olup olmadığını kontrol et
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

    -- 8. Hedef kullanıcının site'de üye olup olmadığını kontrol et
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

    -- 9. Zaten project membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM project_memberships pm
        WHERE pm.project_id = p_project_id
            AND pm.user_id = v_target_user_id
            AND pm.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this project';
    END IF;

    -- 10. Project membership ekle
    INSERT INTO project_memberships (
        project_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        p_project_id,
        v_target_user_id,
        p_project_role,
        v_actor,
        true,
        now(),
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
        'project_membership',
        p_project_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'project_id', p_project_id,
            'site_id', p_site_id,
            'role', p_project_role,
            'invited_by', v_actor
        ),
        now()
    );
    
END;
$$;