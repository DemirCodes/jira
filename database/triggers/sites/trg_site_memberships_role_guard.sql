create or replace function public.trg_site_memberships_role_guard()
returns TRIGGER
language plpgsql
as $$
DECLARE
    v_org_id uuid;
    v_org_role org_role;
BEGIN
    
    SELECT
        s.org_id
    INTO
        v_org_id
    from
        public.sites as s
    where
        s.site_id = NEW.site_id;

    if v_org_id is null THEN
        raise exception 'Organization not found for site %',
                        NEW.site_id;
    end if;

    

    SELECT
        om.role
    INTO
        v_org_role
    from
        public.organization_memberships as om 
    where
        om.org_id = v_org_id
        AND
        om.user_id = NEW.user_id
        AND
        om.membership_is_active = TRUE
        AND
        om.deleted_at is null;

    
    if v_org_role is null THEN
        RAISE exception 'User % is not an active member of organization %',
                        NEW.user_id,v_org_id;
    end if;

    if v_org_role = 'viewer' and NEW.role != 'viewer' THEN
        raise exception 'Role escalation blocked: org_role=viewer cannot be assigned site_role=%',NEW.role;
    end if;

    if v_org_role = 'member' and NEW.role = 'admin' THEN
        raise EXCEPTION 'Role escalation blocked: org_role=member cannot assigned admin';
    end if;

    return new;
END;
$$;

drop trigger if exists site_memberships_role_guard_trigger on public.site_memberships;

create trigger site_memberships_role_guard_trigger
BEFORE
    insert or update of role on public.site_memberships
for each ROW
execute function public.trg_site_memberships_role_guard();