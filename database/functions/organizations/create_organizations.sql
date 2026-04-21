
-- create organizations.sql
-- when created organizations this functions will be started


-- they can be create same org_name
create or replace function create_organization(
    org_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_user_id uuid;
    v_org_name text;
begin

    -- normalize name
    v_org_name := trim(org_name);

    -- user check
    v_user_id := auth_current_useR_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- organization name validation
    if v_org_name is null or length(v_org_name) = 0 then
        raise exception 'organization name cannot be empty';
    end if;

    -- organization create
    insert into organizations (
        org_name,
        created_by
    )
    values (
        v_org_name,
        v_user_id
    )
    returning org_id
    into v_org_id;

    -- owner membership create
    insert into organization_memberships (
        org_id,
        user_id,
        role,
        membership_is_active
    )
    values (
        v_org_id,
        v_user_id,
        'owner',
        true
    );

    return v_org_id;

end;
$$;

select * from organizations;

SELECT 
    routine_name
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
AND 
    routine_definition ILIKE '%organizations%';