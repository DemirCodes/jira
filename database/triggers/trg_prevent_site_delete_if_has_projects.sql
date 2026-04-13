-- triggers/trg_prevent_delete_if_has_children.sql

-- Bu trigger soft delete yaparken altında bağlı veri varsa engeller (issue varsa)

-- =====================================================
-- 1. SITE SILINIRKEN ALTINDA PROJE VARSA ENGELLE
-- =====================================================

create or replace function trg_prevent_site_delete_if_has_projects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_project_count bigint;
begin
    -- Sadece soft delete işleminde kontrol et (deleted_at dolduruluyorsa)
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_project_count
        from projects
        where site_id = old.site_id
            and deleted_at is null;
        
        if v_project_count > 0 then
            raise exception 'Cannot delete site. It has % active project(s). Please delete or archive projects first.', v_project_count;
        end if;
    end if;
    
    return new;
end;
$$;

drop trigger if exists prevent_site_delete_trigger on sites;

create trigger prevent_site_delete_trigger
    before update on sites
    for each row
    execute function trg_prevent_site_delete_if_has_projects();


-- =====================================================
-- 2. PROJE SILINIRKEN ALTINDA ISSUE VARSA ENGELLE
-- =====================================================

create or replace function trg_prevent_project_delete_if_has_issues()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_issue_count bigint;
begin
    -- Sadece soft delete işleminde kontrol et
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_issue_count
        from issues
        where project_id = old.project_id
            and deleted_at is null;
        
        if v_issue_count > 0 then
            raise exception 'Cannot delete project. It has % active issue(s). Please delete or close issues first.', v_issue_count;
        end if;
    end if;
    
    return new;
end;
$$;

drop trigger if exists prevent_project_delete_trigger on projects;

create trigger prevent_project_delete_trigger
    before update on projects
    for each row
    execute function trg_prevent_project_delete_if_has_issues();


-- =====================================================
-- 3. ORGANIZATION SILINIRKEN ALTINDA SITE VARSA ENGELLE
-- =====================================================

create or replace function trg_prevent_org_delete_if_has_sites()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_site_count bigint;
begin
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_site_count
        from sites
        where org_id = old.org_id
            and deleted_at is null;
        
        if v_site_count > 0 then
            raise exception 'Cannot delete organization. It has % active site(s). Please delete or archive sites first.', v_site_count;
        end if;
    end if;
    
    return new;
end;
$$;

drop trigger if exists prevent_org_delete_trigger on organizations;

create trigger prevent_org_delete_trigger
    before update on organizations
    for each row
    execute function trg_prevent_org_delete_if_has_sites();


-- =====================================================
-- 4. ISSUE SILINIRKEN ALTINDA CHILD ISSUE VARSA ENGELLE
-- =====================================================

create or replace function trg_prevent_issue_delete_if_has_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_child_count bigint;
begin
    if new.deleted_at is not null and old.deleted_at is null then
        select count(*) into v_child_count
        from issues
        where parent_issue_id = old.issue_id
            and deleted_at is null;
        
        if v_child_count > 0 then
            raise exception 'Cannot delete issue. It has % child issue(s). Please delete or move child issues first.', v_child_count;
        end if;
    end if;
    
    return new;
end;
$$;

drop trigger if exists prevent_issue_delete_trigger on issues;

create trigger prevent_issue_delete_trigger
    before update on issues
    for each row
    execute function trg_prevent_issue_delete_if_has_children();