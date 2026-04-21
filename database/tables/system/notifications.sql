-- jira_db'de çalıştır

CREATE TABLE IF NOT EXISTS notifications (
    notification_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    metadata jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz,
    deleted_at timestamptz
);

-- Index'ler
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL;