/*
    Site membership sadece 3 yetkili yapabilir:
    - auth_is_org_owner
    - auth_is_org_admin
    - auth_is_site_admin

    Kurallar:
    1. auth_is_org_owner: her zaman ekleyebilir (is_private kontrolü yok)
    2. auth_is_site_admin: her zaman ekleyebilir (is_private kontrolü yok)
    3. auth_is_org_admin: sadece site_admin değilse ve is_private = false ise ekleyebilir
    4. User'lar user_friendship_code ile eklenir
    5. User organization_memberships'te yoksa site_memberships'e eklenemez
*/

CREATE OR REPLACE FUNCTION invite_site(
    p_friendship_code uuid,  -- user_friendship_code ile çağrılacak
    p_org_id uuid,
    p_site_id uuid,
    p_site_role site_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = PUBLIC
AS $$
DECLARE
    v_actor uuid;
    v_target_user_id uuid;
    v_is_site_private boolean;
    v_user_in_org boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
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

    -- 3. Yetki kontrolleri için flag'leri al
    v_is_org_owner := auth_is_org_owner(p_org_id);
    v_is_org_admin := auth_is_org_admin(p_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);

    -- 4. Yetki kontrolü - en az birine sahip olmalı
    IF NOT (v_is_org_owner OR v_is_org_admin OR v_is_site_admin) THEN
        RAISE EXCEPTION 'Permission denied: Only org owner, org admin, or site admin can invite users';
    END IF;

    -- 5. Site'in private olup olmadığını kontrol et
    SELECT is_private INTO v_is_site_private
    FROM sites
    WHERE site_id = p_site_id
        AND deleted_at IS NULL;
    
    -- 6. Yetki kontrolü 
    -- Yetkisiz durumları kontrol et, yetkili durumlar otomatik geçer
    IF NOT (v_is_org_owner OR (v_is_org_admin AND v_is_site_admin)) THEN
        -- Yetkili değil, şimdi neden yetkisiz olduğunu bul
        IF v_is_org_admin AND NOT v_is_site_admin AND v_is_site_private = true THEN
            RAISE EXCEPTION 'Permission denied: Org admin cannot invite users to private sites';
        ELSE
            RAISE EXCEPTION 'Permission denied: You are not authorized to invite users to this site';
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

    -- 8. Zaten site membership var mı kontrol et
    IF EXISTS (
        SELECT 1
        FROM site_memberships sm
        WHERE sm.site_id = p_site_id
            AND sm.user_id = v_target_user_id
            AND sm.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a membership in this site';
    END IF;

    -- 9. Site membership ekle
    INSERT INTO site_memberships (
        site_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        p_site_id,
        v_target_user_id,
        p_site_role,
        v_actor,
        true,
        now(),
        now(),
        now()
    );

    -- 10. Audit log
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
        'site_membership',
        p_site_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'site_id', p_site_id,
            'role', p_site_role,
            'invited_by', v_actor
        ),
        now()
    );

END;
$$;