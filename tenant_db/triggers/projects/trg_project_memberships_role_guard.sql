-- triggers/projects/trg_project_memberships_role_guard.sql

create or replace function trg_project_memberships_role_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_org_role org_role;
begin
    -- 1. Projenin bağlı olduğu organization'ı bul
    select s.org_id into v_org_id
    from projects p
    join sites s on s.site_id = p.site_id
    where p.project_id = new.project_id
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_org_id is null then
        raise exception 'Organization not found for project %', new.project_id;
    end if;

    -- 2. Kullanıcının organization'daki rolünü al
    select om.role into v_org_role
    from organization_memberships om
    where om.org_id = v_org_id
        and om.user_id = new.user_id
        and om.membership_is_active = true
        and om.deleted_at is null;

    if v_org_role is null then
        raise exception 'User % is not an active member of organization %', new.user_id, v_org_id;
    end if;

    -- 3. Rol atama kontrolü 
    if not can_assign_project_role(v_org_role, new.role) then
        raise exception 'Role escalation blocked: org_role=% cannot be assigned project_role=%', v_org_role, new.role;
    end if;

    return new;
end;
$$;

-- Trigger'ı oluştur
drop trigger if exists project_memberships_role_guard_trigger on project_memberships;

create trigger project_memberships_role_guard_trigger
    before insert or update of role on project_memberships
    for each row
    execute function trg_project_memberships_role_guard();