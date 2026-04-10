-- soft delete 

create or replace function soft_delete_organization(
    p_org_id uuid
)
returns void 
language plpgsql
security definer
set search_path = PUBLIC
as $$ 
DECLARE
    v_user_id uuid;
BEGIN

    -- user 
    v_user_id := auth_current_user_id();

    if v_user_id is null THEN
        raise exception 'user not authenticated';
    end if;

    -- owner kontrol 
    if not auth_is_org_owner(p_org_id) then
        raise exception 'only owner can delete organization';
    end if;


    -- zaten sılınmısmı check
    if exists (
        select 
            1
        from 
            organizations
        where 
            org_id = p_org_id
            AND
            deleted_at is not NULL
    ) THEN
        raise exception 'organization already deleted';
    end if;

    -- soft delete
    update organizations    
    set deleted_at = now()
    where org_id = p_org_id;

end;
$$; 
