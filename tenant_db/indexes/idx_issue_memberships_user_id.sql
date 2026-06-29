-- indexes/idx_issue_memberships_user_id.sql

-- Issue memberships tablosu için index'ler

-- 1. user_id üzerinde index (kullanıcının üye olduğu issue'lar için)
create index if not exists idx_issue_memberships_user_id 
    on issue_memberships (user_id) 
    where deleted_at is null;

-- 2. issue_id üzerinde index (issue'daki üyeleri bulmak için)
create index if not exists idx_issue_memberships_issue_id 
    on issue_memberships (issue_id) 
    where deleted_at is null;

-- 3. role üzerinde index (role göre filtreleme için)
create index if not exists idx_issue_memberships_role 
    on issue_memberships (role) 
    where deleted_at is null;

-- 4. membership_is_active üzerinde index (aktif üyelikler için)
create index if not exists idx_issue_memberships_is_active 
    on issue_memberships (membership_is_active) 
    where deleted_at is null;

-- 5. Composite index (user_id + issue_id) - unique zaten var ama performans için
create index if not exists idx_issue_memberships_user_issue 
    on issue_memberships (user_id, issue_id) 
    where deleted_at is null;

-- 6. Composite index (issue_id + role) - issue'daki belirli roldeki üyeler için
create index if not exists idx_issue_memberships_issue_role 
    on issue_memberships (issue_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 7. Composite index (user_id + role) - kullanıcının belirli roldeki issue'ları için
create index if not exists idx_issue_memberships_user_role 
    on issue_memberships (user_id, role) 
    where membership_is_active = true 
    and deleted_at is null;