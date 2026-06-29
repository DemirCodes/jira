-- Active: 1772756684414@@127.0.0.1@5432@jira
-- Bildirimleri listele
CREATE OR REPLACE FUNCTION list_notifications(
    p_user_id uuid,
    p_unread_only boolean DEFAULT false,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE(
    notification_id uuid,
    type text,
    title text,
    content text,
    is_read boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_id != auth_current_user_id() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    RETURN QUERY
    SELECT n.notification_id, n.type, n.title, n.content, n.is_read, n.created_at
    FROM notifications n
    WHERE n.user_id = p_user_id
        AND n.deleted_at IS NULL
        AND (p_unread_only = false OR n.is_read = false)
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Okundu işaretle
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE notification_id = p_notification_id
        AND user_id = auth_current_user_id()
        AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$;