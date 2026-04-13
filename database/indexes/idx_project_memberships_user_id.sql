-- indexes/idx_project_memberships_user_id.sql

-- Project memberships tablosu için index'ler

-- 1. user_id üzerinde index (kullanıcının üye olduğu project'lar için)
create index if not exists idx_project_memberships_user_id 
    on project_memberships (user_id) 
    where deleted_at is null;

-- 2. project_id üzerinde index (project'deki üyeleri bulmak için)
create index if not exists idx_project_memberships_project_id 
    on project_memberships (project_id) 
    where deleted_at is null;

-- 3. role üzerinde index (role göre filtreleme için)
create index if not exists idx_project_memberships_role 
    on project_memberships (role) 
    where deleted_at is null;

-- 4. membership_is_active üzerinde index (aktif üyelikler için)
create index if not exists idx_project_memberships_is_active 
    on project_memberships (membership_is_active) 
    where deleted_at is null;

-- 5. invited_by üzerinde index (kimin davet ettiğini bulmak için)
create index if not exists idx_project_memberships_invited_by 
    on project_memberships (invited_by) 
    where deleted_at is null;

-- 6. Composite index (user_id + project_id) - unique zaten var ama performans için
create index if not exists idx_project_memberships_user_project 
    on project_memberships (user_id, project_id) 
    where deleted_at is null;

-- 7. Composite index (project_id + role) - project'deki belirli roldeki üyeler için
create index if not exists idx_project_memberships_project_role 
    on project_memberships (project_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 8. Composite index (user_id + role) - kullanıcının belirli roldeki project'ları için
create index if not exists idx_project_memberships_user_role 
    on project_memberships (user_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 9. Composite index (project_id + membership_is_active) - aktif üyeleri bulmak için
create index if not exists idx_project_memberships_project_active 
    on project_memberships (project_id, membership_is_active) 
    where deleted_at is null;