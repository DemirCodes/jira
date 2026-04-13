-- indexes/idx_organization_memberships_user_id.sql

-- Organization memberships tablosu için index'ler

-- 1. user_id üzerinde index (kullanıcının üye olduğu organization'lar için)
create index if not exists idx_organization_memberships_user_id 
    on organization_memberships (user_id) 
    where deleted_at is null;

-- 2. org_id üzerinde index (organization'daki üyeleri bulmak için)
create index if not exists idx_organization_memberships_org_id 
    on organization_memberships (org_id) 
    where deleted_at is null;

-- 3. role üzerinde index (role göre filtreleme için)
create index if not exists idx_organization_memberships_role 
    on organization_memberships (role) 
    where deleted_at is null;

-- 4. membership_is_active üzerinde index (aktif üyelikler için)
create index if not exists idx_organization_memberships_is_active 
    on organization_memberships (membership_is_active) 
    where deleted_at is null;

-- 5. invited_by üzerinde index (kimin davet ettiğini bulmak için)
create index if not exists idx_organization_memberships_invited_by 
    on organization_memberships (invited_by) 
    where deleted_at is null;

-- 6. joined_at üzerinde index (katılma tarihine göre sıralama için)
create index if not exists idx_organization_memberships_joined_at 
    on organization_memberships (joined_at desc) 
    where deleted_at is null;

-- 7. Composite index (user_id + org_id) - unique zaten var ama performans için
create index if not exists idx_organization_memberships_user_org 
    on organization_memberships (user_id, org_id) 
    where deleted_at is null;

-- 8. Composite index (org_id + role) - organization'daki belirli roldeki üyeler için
create index if not exists idx_organization_memberships_org_role 
    on organization_memberships (org_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 9. Composite index (user_id + role) - kullanıcının belirli roldeki organization'ları için
create index if not exists idx_organization_memberships_user_role 
    on organization_memberships (user_id, role) 
    where membership_is_active = true 
    and deleted_at is null;

-- 10. Composite index (org_id + membership_is_active) - aktif üyeleri bulmak için
create index if not exists idx_organization_memberships_org_active 
    on organization_memberships (org_id, membership_is_active) 
    where deleted_at is null;