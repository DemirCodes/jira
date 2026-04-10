create or replace function invite_user_to_organization(
    p_user_friendship_code uuid,  -- friendship code ile davet et
    p_org_id uuid,
    p_role org_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid;      -- davet eden kişinin uuid'si
    v_target_user_id uuid;  -- davet edilen kişinin uuid'si
begin
    -- 1. Davet eden kişinin kontrolü
    v_actor := auth_current_user_id();

    if v_actor is null then 
        raise exception 'User not authenticated';
    end if;

    -- 2. Yetki kontrolü (org_owner VEYA org_admin)
    if not (auth_is_org_owner(p_org_id) or auth_is_org_admin(p_org_id)) then
        raise exception 'Permission denied: Only organization owner or admin can invite users';
    end if;

    -- 3. Friendship code ile davet edilen kullanıcıyı bul
    select user_id into v_target_user_id
    from users
    where user_friendship_code = p_user_friendship_code
        and deleted_at is null
        and user_is_active = true;

    if v_target_user_id is null then
        raise exception 'Invalid friendship code or user not found';
    end if;

    -- 4. Kullanıcı zaten organization üyesi mi kontrol et
    if exists (
        select 1
        from organization_memberships as om
        where om.org_id = p_org_id
            and om.user_id = v_target_user_id
            and om.membership_is_active = true
            and om.deleted_at is null
    ) then
        raise exception 'User is already a member of this organization';
    end if;

    -- 5. Kullanıcı daha önce davet edilmiş ama silinmiş mi kontrol et (reactivation)
    if exists (
        select 1
        from organization_memberships as om
        where om.org_id = p_org_id
            and om.user_id = v_target_user_id
            and om.deleted_at is not null
    ) then
        -- Eski üyeliği reaktive et
        update organization_memberships
        set 
            role = p_role,
            membership_is_active = true,
            invited_by = v_actor,
            joined_at = now(),
            updated_at = now(),
            deleted_at = null,
            deleted_by = null
        where org_id = p_org_id
            and user_id = v_target_user_id;
    else
        -- 6. Yeni organization membership ekle
        insert into organization_memberships (
            org_id,
            user_id,
            role,
            membership_is_active,
            invited_by,
            joined_at,
            created_at,
            updated_at
        )
        values (
            p_org_id,
            v_target_user_id,
            p_role,
            true,
            v_actor,
            now(),
            now(),
            now()
        );
    end if;

    -- 7. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_actor,
        'organization_membership',
        p_org_id,
        'INVITE',
        jsonb_build_object(
            'user_id', v_target_user_id,
            'org_id', p_org_id,
            'role', p_role,
            'invited_by', v_actor
        ),
        now()
    );
end;
$$;