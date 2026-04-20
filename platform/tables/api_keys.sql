-- 1. Database'e bağlan
\c jira_platform_db


CREATE EXTENSION IF NOT EXISTS citext;


-- 2. Önce platform_users tablosunu oluştur (foreign key yok)
CREATE TABLE IF NOT EXISTS platform_users (
    platform_user_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email citext UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role platform_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid
);

-- 3. Sonra user_sessions (platform_user_id'ye referans verir)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_user_id uuid REFERENCES platform_users(platform_user_id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    revoked_at timestamptz
);

-- 4. En son api_keys
CREATE TABLE IF NOT EXISTS api_keys (
    api_key_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_user_id uuid REFERENCES platform_users(platform_user_id) ON DELETE CASCADE,
    key_name text NOT NULL,
    api_key_hash text NOT NULL,
    last_used_at timestamptz,
    expires_at timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);


