CREATE OR REPLACE FUNCTION public.trg_site_memberships_role_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_org_id uuid;
    v_org_role org_role;
BEGIN
    SELECT s.org_id INTO v_org_id
    FROM public.sites AS s
    WHERE s.site_id = NEW.site_id;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Organization not found for site %', NEW.site_id;
    END IF;

    SELECT om.role INTO v_org_role
    FROM public.organization_memberships AS om
    WHERE om.org_id = v_org_id
      AND om.user_id = NEW.user_id
      AND om.membership_is_active = TRUE
      AND om.deleted_at IS NULL;

    IF v_org_role IS NULL THEN
        RAISE EXCEPTION 'User % is not an active member of organization %', NEW.user_id, v_org_id;
    END IF;

    -- Owner ve admin için kısıtlama yok
    IF v_org_role IN ('owner', 'admin') THEN
        RETURN NEW;
    END IF;

    -- Viewer sadece viewer olabilir
    IF v_org_role = 'viewer' AND NEW.role != 'viewer' THEN
        RAISE EXCEPTION 'Role escalation blocked: org_role=viewer cannot be assigned site_role=%', NEW.role;
    END IF;

    -- Member admin olamaz
    IF v_org_role = 'member' AND NEW.role = 'admin' THEN
        RAISE EXCEPTION 'Role escalation blocked: org_role=member cannot be assigned admin';
    END IF;

    RETURN NEW;
END;
$$;

drop trigger if exists site_memberships_role_guard_trigger on public.site_memberships;

create trigger site_memberships_role_guard_trigger
BEFORE
    insert or update of role on public.site_memberships
for each ROW
execute function public.trg_site_memberships_role_guard();