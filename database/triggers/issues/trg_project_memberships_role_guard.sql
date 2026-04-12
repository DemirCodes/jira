-- triggers/issues/trg_issue_memberships_role_guard.sql

create or replace function trg_issue_memberships_role_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_project_id uuid;
    v_org_role org_role;
    v_project_role project_role;
begin
    -- 1. Issue'nun bağlı olduğu proje ve organization'ı bul
    select 
        i.project_id,
        p.site_id,
        s.org_id
    into 
        v_project_id,
        v_site_id,
        v_org_id
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.issue_id = new.issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_org_id is null then
        raise exception 'Organization not found for issue %', new.issue_id;
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

    -- 3. Kullanıcının project'teki rolünü al (varsa)
    select pm.role into v_project_role
    from project_memberships pm
    where pm.project_id = v_project_id
        and pm.user_id = new.user_id
        and pm.membership_is_active = true
        and pm.deleted_at is null;

    -- 4. Rol atama kuralları
    -- Issue role'leri: contributor, reviewer, watcher
    
    -- Org owner: her rolü atayabilir
    if v_org_role = 'owner' then
        -- devam et
        null;
    
    -- Org admin: sadece site ve project private değilse atayabilir
    elsif v_org_role = 'admin' then
        -- private kontrolü yapılacak (opsiyonel)
        null;
    
    -- Project admin: contributor, reviewer, watcher atayabilir
    elsif v_project_role = 'project_admin' then
        -- devam et
        null;
    
    -- Project contributor: sadece watcher atayabilir
    elsif v_project_role = 'contributor' then
        if new.role != 'watcher' then
            raise exception 'Project contributor can only assign watcher role to issues';
        end if;
    
    -- Project reviewer: sadece watcher atayabilir
    elsif v_project_role = 'reviewer' then
        if new.role != 'watcher' then
            raise exception 'Project reviewer can only assign watcher role to issues';
        end if;
    
    -- Diğerleri: yetkisiz
    else
        raise exception 'Permission denied: User cannot assign roles to this issue';
    end if;

    return new;
end;
$$;

-- Trigger'ı oluştur
drop trigger if exists issue_memberships_role_guard_trigger on issue_memberships;

create trigger issue_memberships_role_guard_trigger
    before insert or update of role on issue_memberships
    for each row
    execute function trg_issue_memberships_role_guard();