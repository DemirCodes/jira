-- Active: 1772756684414@@127.0.0.1@5432@jira
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);