-- Active: 1776697997973@@127.0.0.1@5432@jira_platform_db

CREATE VIEW platform_activity_log AS
SELECT 
    'login' as event_type,
    la.email,
    la.success::text as status,  
    la.attempted_at as event_time
FROM login_attempts la
JOIN platform_users pu ON pu.email = la.email

UNION ALL

SELECT 
    'session' as event_type,
    pu.email,
    CASE WHEN s.revoked_at IS NULL THEN 'active' ELSE 'revoked' END as status,
    s.created_at as event_time
FROM user_sessions s
JOIN platform_users pu ON pu.platform_user_id = s.platform_user_id;