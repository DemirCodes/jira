-- Active: 1778846018554@@127.0.0.1@5432@jira
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities (project_id);