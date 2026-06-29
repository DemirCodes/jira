-- Active: 1778846018554@@127.0.0.1@5432@jira
CREATE TABLE IF NOT EXISTS project_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    project_id UUID NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (user_id) ON DELETE SET NULL, -- Kullanıcı silinse bile log kalsın
    action_type VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);