-- Active: 1772756684414@@127.0.0.1@5432@jira
-- Tenant database (jira) için
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;

-- NOT: Platform database (jira_platform_db) için platform_users tablosuna da eklemek istersen:
-- ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);