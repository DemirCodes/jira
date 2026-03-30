-- create sites.sql
-- when created sites this func ll be started


-- site status type enum kontrol 
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'site_status'
ORDER BY 
    e.enumsortorder;


-- site rollerı type enum kontrol 
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'site_role'
ORDER BY 
    e.enumsortorder;

SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'org_role'
ORDER BY 
    e.enumsortorder;

SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'org_status'
ORDER BY 
    e.enumsortorder;


create or replace function delete_site(
    p_site_id uuid,
    p_org_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_status site_status;
begin
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    select org_id, site_status into v_org_id, v_site_status
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found or already deleted';
    end if;
    
    if v_site_status = 'archived' then
        raise exception 'Site is already archived';
    end if;
    
    if v_site_status = 'suspended' then
        raise exception 'Cannot delete suspended site. Please activate first.';
    end if;
    
    if p_org_id is not null then
        v_org_id := get_organization_id(p_org_id);
    else
        v_org_id := get_organization_id(v_org_id);
    end if;
    
    if not (
        auth_is_org_owner(v_org_id) or 
        auth_is_site_admin(p_site_id)
    ) then
        raise exception 'Only organization owner or site admin can delete sites';
    end if;
    
    update sites
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        site_status = 'archived',  
        updated_at = now()
    where site_id = p_site_id;
    
    update site_memberships
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    where site_id = p_site_id
        and deleted_at is null;
    
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
        v_user_id,
        'site',
        p_site_id,
        'DELETE',
        jsonb_build_object(
            'site_id', p_site_id,
            'deleted_by', v_user_id,
            'deleted_at', now()
        ),
        now()
    );
    
    return true;
    
end;
$$;



        
