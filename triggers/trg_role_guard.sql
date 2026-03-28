
-- role guard trigger helper function
create function public.trg_site_memberships_role_guard()
RETURNS TRIGGER
language plpgsql
as $$
DECLARE
    v_org_id uuid;
    v_org_role org_role;

BEGIN
    
    
    IF not EXISTS
        (
            select 
                1
            from 
                organizations as o
            where
                o.org_id = v_org_id;   
        )
        THEN
            RAISE EXCEPTION 'Its not already organization %',v_org_id;
    end if;

    

    SELECT
        s.org_id
    INTO    
        v_org_id
    from 
        sites as s
    where
        s.site_id = NEW.site_id;
    



    if v_org_id is null THEN
        raise exception 'Organization not found for site %',NEW.site_id;
    end if;

    SELECT
        om.role
    into 
        v_org_role
    from 
        organization_memberships as om 
    where 
        om.org_id = v_org_id
        AND
        om.user_id = NEW.user_id
        AND
        om.membership_is_active = true
        AND
        om.deleted_at is null;

    
    if v_org_role is null THEN
        raise exception 'User % is not an active member of organization %',
                        NEW.user_id, v_org_id;
    end if;


    if v_org_role = 'viewer' AND NEW.role != 'viewer' THEN
        raise EXCEPTION 'Role escalation blocked: org_role= viewer cannot be assigned site_role = %',
                        NEW.role;

    end if;

    return NEW;

END;
$$;

create trigger site_memberships_role_guard
before insert or update of role ON public.site_memberships
for each row execute
FUNCTION public.trg_site_memberships_role_guard();



