-- indexes/idx_site_memberships_user_id.sql

-- Site memberships tablosu için index'ler

-- 1. user_id üzerinde index (kullanıcının üye olduğu site'lar için)
create index if not exists idx_site_memberships_user_id 
    on site_memberships (user_id) 
    where deleted_at is null;

-- 2. site_id üzerinde index (site'deki üyeleri bulmak için)
create index if not exists idx_site_memberships_site_id 
    on site_memberships (site_id) 
    where deleted_at is null;

-- 3. role üzerinde index (role göre filtreleme için)
create index if not exists idx_site_memberships_role 
    on site_memberships (role) 
    where deleted_at is null;

-- 4. membership_is_active üzerinde index (aktif üyelikler için)
create index if not exists idx_site_memberships_is_active 
    on site_memberships (membership_is_active) 
    where deleted_at is null;

-- 5. invited_by üzerinde index (kimin davet ettiğini bulmak için)
create index if not exists idx_site_memberships_invited_by 
    on site_memberships (invited_by) 
    where deleted_at is null;

-- 6. joined_at üzerinde index (katılma tarihine göre sıralama için)
create index if not exists idx_site_memberships_joined_at 
    on site_memberships (joined_at desc) 
    where deleted_at is null;

-- 7. Composite index (user_id + site_id) - unique zaten var ama performans için
create index if not exists idx_site_memberships_user_site 
    on site_memberships (user_id, site_id) 
    where deleted_at is null;

-- 8. Composite index (site_id + role) - site'deki belirli roldeki üyeler için
create index if not exists idx_site_memberships_site_role 
    on site_memberships (site_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 9. Composite index (user_id + role) - kullanıcının belirli roldeki site'ları için
create index if not exists idx_site_memberships_user_role 
    on site_memberships (user_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 10. Composite index (site_id + membership_is_active) - aktif üyeleri bulmak için
create index if not exists idx_site_memberships_site_active 
    on site_memberships (site_id, membership_is_active) 
    where deleted_at is null;