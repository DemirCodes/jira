create or replace function invite_user_to_organization
(
    p_user_id uuid,
    p_org_id uuid,
    p_role org_role
)
returns void
language plpgsql
SECURITY DEFINER
set search_path = PUBLIC
as $$
declare
    v_actor uuid; -- davet eden kısının uuid si 
begin

    v_actor:= auth_current_user_id();

    if 
        v_actor is null then 
            raise exception 'user not authenticated';
    end if;


    if not 
        auth_is_org_owner(p_org_id) 
        AND
        auth_is_org_admin(p_org_id)
        then
        raise exception 
            'permisson denied';
    end if;

    if exists 
    (
        select
            1
        from
            organization_memberships as om
        where
            org_id = p_org_id
            AND
            user_id = p_user_id
            AND
            membership_is_active = TRUE
            AND
            deleted_at is NULL
    ) THEN
        raise EXCEPTION 'User already member'
    end if;

    insert into 
        organization_memberships
        (
            org_id,
            user_id,
            role,
            membership_is_active,
            invited_by
        )
        values
        (
            p_org_id,
            p_user_id,
            p_role,
            true,
            v_actor
        );

    
end;
$$;
