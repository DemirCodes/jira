-- indexes/idx_users_auth.sql

-- Users tablosu için index'ler

-- 1. email üzerinde index (login için hızlı arama)
create index if not exists idx_users_email 
    on users (user_email) 
    where deleted_at is null and user_is_active = true;

-- 2. friendship_code üzerinde index (davet sistemi için)
create index if not exists idx_users_friendship_code 
    on users (user_friendship_code) 
    where deleted_at is null and user_is_active = true;

-- 3. user_name üzerinde index (isimle arama için)
create index if not exists idx_users_name 
    on users (user_name) 
    where deleted_at is null;

-- 4. created_at üzerinde index (tarihe göre sıralama için)
create index if not exists idx_users_created_at 
    on users (created_at desc) 
    where deleted_at is null;

-- 5. Composite index (is_active + deleted_at) - aktif kullanıcıları bulmak için
create index if not exists idx_users_active 
    on users (user_is_active) 
    where deleted_at is null;