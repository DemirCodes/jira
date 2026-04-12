-- triggers/trg_assets_update.sql

-- Bu trigger tüm asset tabloları için ortak updated_at güncellemesi yapar

create or replace function trg_assets_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- =====================================================
-- TABLOLAR İÇİN TRIGGER'LAR
-- =====================================================

-- 1. organization_assets trigger
drop trigger if exists organization_assets_update_trigger on organization_assets;

create trigger organization_assets_update_trigger
    before update on organization_assets
    for each row
    execute function trg_assets_update();

-- 2. site_assets trigger
drop trigger if exists site_assets_update_trigger on site_assets;

create trigger site_assets_update_trigger
    before update on site_assets
    for each row
    execute function trg_assets_update();

-- 3. project_assets trigger
drop trigger if exists project_assets_update_trigger on project_assets;

create trigger project_assets_update_trigger
    before update on project_assets
    for each row
    execute function trg_assets_update();

-- 4. issue_assets trigger
drop trigger if exists issue_assets_update_trigger on issue_assets;

create trigger issue_assets_update_trigger
    before update on issue_assets
    for each row
    execute function trg_assets_update();